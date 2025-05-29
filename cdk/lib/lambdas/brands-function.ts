import { Anthropic } from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import {
  BrandNameSuggestionRequest,
  BrandNameSuggestionResponse,
  BrandNameSuggestion,
} from "../../../common/types";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./utils/lambda-utils";

// Initialize clients outside the handler for potential reuse
const secretsClient = new SecretsManagerClient({});
let anthropic: Anthropic | undefined; 

async function getApiKey(secretName: string): Promise<string> {
  console.log("Retrieving API key from Secrets Manager for secret", secretName);
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const data = await secretsClient.send(command);
    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString);
      if (secret.apiKey && typeof secret.apiKey === "string") {
        return secret.apiKey;
      }
      throw new Error(
        "'apiKey' field not found or not a string in secret JSON."
      );
    }
    throw new Error(
      "API key not found in secret string (SecretString is empty)."
    );
  } catch (error: any) {
    console.error(
      `Error retrieving API key '${secretName}':`,
      error.message,
      error
    );
    throw new HttpError(
      `Could not retrieve API key from Secrets Manager for secret '${secretName}'.`,
      500,
      { detail: error.message }
    );
  }
}

async function initializeAnthropicClient(): Promise<Anthropic> {
  if (anthropic) {
    return anthropic;
  }
  const claudeSecretName = process.env.CLAUDE_SECRET_NAME;
  if (!claudeSecretName) {
    console.error("CLAUDE_SECRET_NAME environment variable not set.");
    throw new HttpError(
      "Server configuration error: CLAUDE_SECRET_NAME not set.",
      500
    );
  }
  const apiKey = await getApiKey(claudeSecretName);
  anthropic = new Anthropic({ apiKey });
  return anthropic;
}

function constructClaudePrompt(
  request: BrandNameSuggestionRequest,
  defaultCount: number
): string {
  const {
    prompt, // This is the "description"
    industry,
    style,
    keywords,
    length,
    count = defaultCount,
  } = request;

  // Start with a clear instruction about the desired output (brand names AND taglines)
  let fullPrompt = `Your goal is to generate ${count} unique and creative brand name and tagline pairs.\n\nConsider the following criteria carefully:\n- Core Idea/Description: ${prompt}\n`;

  if (industry) fullPrompt += `- Industry: ${industry}\n`;
  if (style) fullPrompt += `- Desired Style/Vibe: ${style}\n`; // Slightly rephrased for clarity
  if (keywords && keywords.length > 0) {
    fullPrompt += `- Key Themes/Keywords to incorporate or allude to: ${keywords.join(", ")}\n`; // Clarify role of keywords
  }
  if (length) {
    fullPrompt += `- Target Brand Name Length: Approximately ${length} characters. Shorter is often better if it's impactful.\n`; // Added a small hint
  }

  fullPrompt += `
For each of the ${count} suggestions:
1.  **Brand Name:** Should be memorable, distinct, easy to spell, and easy to pronounce. It should be relevant to the core idea and style. If an industry is provided, aim for names that are differentiated from common existing brands in that industry.
2.  **Tagline:** Should be concise (ideally 3-7 words), compelling, and capture the brand's essence or unique selling proposition. It must complement the brand name.

Output Format:
Provide the response as a list of brand name and tagline pairs. Each pair MUST be formatted exactly as follows, with 'Brand Name:' and 'Tagline:' on separate lines, followed by a blank line before the next pair. Do not include any numbering, introductory/concluding text, or any other explanations.

Brand Name: [The Brand Name]
Tagline: [The Tagline]

Brand Name: [Another Brand Name]
Tagline: [Another Tagline]
`; // Reinforced output format and added detail for name/tagline quality

  return fullPrompt;
}

const brandNameSuggesterLogic: CoreLambdaLogic<
  BrandNameSuggestionRequest,
  BrandNameSuggestionResponse
> = async (payload) => {
  if (
    !payload.body ||
    !payload.body.prompt ||
    typeof payload.body.prompt !== "string" ||
    !payload.body.prompt.trim()
  ) {
    throw new HttpError(
      "Prompt is required and must be a non-empty string",
      400
    );
  }

  const requestBody = payload.body;
  const requestedCount = requestBody.count || 6; // Default to 5 suggestions

  const client = await initializeAnthropicClient();
  const systemPromptContent =
    "You are 'BrandSpark', a world-class AI branding assistant. Your expertise lies in crafting unique brand names and impactful taglines. You are highly creative, pay close attention to user requirements, and strictly adhere to the requested output format.";
  const userPromptContent = constructClaudePrompt(requestBody, requestedCount);

  console.log("Constructed user prompt for Claude:", userPromptContent);

  try {
    const claudeModel = process.env.CLAUDE_MODEL || "claude-3-opus-20240229";
    const temperature = parseFloat(process.env.CLAUDE_TEMPERATURE || "0.7");
    const maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || "200", 10); // Reduced max tokens for name lists

    const messages: MessageParam[] = [
      { role: "user", content: userPromptContent },
    ];

    const response = await client.messages.create({
      model: claudeModel,
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPromptContent, // Added system prompt
      messages: messages,
    });

    console.log("Claude API response received.", response);

    let suggestions: BrandNameSuggestion[] = [];
    if (
      response.content &&
      response.content.length > 0 &&
      response.content[0].type === "text"
    ) {
      const text = response.content[0].text.trim();
      const pairs = text.split(/\n\s*\n/); // Split by blank lines between pairs
      for (const pair of pairs) {
        const lines = pair.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let name = "";
        let tagline = "";
        if (lines.length >= 2) {
          const nameLine = lines.find(l => l.startsWith("Brand Name:"));
          const taglineLine = lines.find(l => l.startsWith("Tagline:"));
          if (nameLine) {
            name = nameLine.substring("Brand Name:".length).trim();
          }
          if (taglineLine) {
            tagline = taglineLine.substring("Tagline:".length).trim();
          }
        }
        if (name && tagline) {
          suggestions.push({ name, tagline });
        }
      }
    }

    // Ensure we don't return more than requested, even if Claude provides more formatted pairs
    suggestions = suggestions.slice(0, requestedCount);

    console.log("Returning suggestions:", suggestions);
    
    return { suggestions };
  } catch (error: any) {
    console.error("Error calling Claude API:", error.message, error);
    // Check for specific Anthropic error types if available/needed
    // e.g., if (error instanceof Anthropic.APIError) { ... }
    throw new HttpError(
      error.message || "Failed to generate brand name suggestions",
      error.status || 500
    );
  }
};

export const handler = createApiHandler<BrandNameSuggestionRequest, BrandNameSuggestionResponse>(
  brandNameSuggesterLogic,
  {
    allowedMethods: ["POST"],
    isBodyRequired: true,
  }
);
