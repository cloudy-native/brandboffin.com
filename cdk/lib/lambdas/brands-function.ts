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

  let fullPrompt = `Your goal is to generate ${count} unique and creative brand name, tagline, and domain suggestion sets.\n\nConsider the following criteria carefully:\n- Core Idea/Description: ${prompt}\n`;

  if (industry) fullPrompt += `- Industry: ${industry}\n`;
  if (style) fullPrompt += `- Desired Style/Vibe: ${style}\n`;
  if (keywords && keywords.length > 0) {
    fullPrompt += `- Key Themes/Keywords to incorporate or allude to: ${keywords.join(", ")}\n`;
  }
  if (length) {
    fullPrompt += `- Target Brand Name Length: Approximately ${length} characters. Shorter is often better if it's impactful.\n`;
  }

  fullPrompt += `
For each of the ${count} suggestions, provide:
1.  **Brand Name:** Memorable, distinct, easy to spell and pronounce, relevant to the core idea and style. Differentiated if an industry is provided.
2.  **Tagline:** Concise (3-7 words), compelling, capturing the brand's essence, complementing the brand name.
3.  **Suggested Domains:** An array of 3-5 relevant domain name suggestions (e.g., brandname.com, getbrandname.io, brandname.ai). Include a mix of common and creative TLDs.

Output Format:
VERY IMPORTANT: Provide the entire response as a single, valid JSON array. Each element in the array should be an object with the following keys: "name" (string), "tagline" (string), and "suggestedDomains" (array of strings). Do not include any introductory/concluding text, explanations, or any other text outside of this JSON array.

Example of the exact JSON output format required:
[
  {
    "name": "Innovatech Solutions",
    "tagline": "Engineering tomorrow's innovations, today.",
    "suggestedDomains": ["innovatechsolutions.com", "innovatech.ai", "getinnovatech.io"]
  },
  {
    "name": "EcoBloom Organics",
    "tagline": "Naturally nurturing your well-being.",
    "suggestedDomains": ["ecobloomorganics.com", "ecobloom.store", "bloomsustainably.com"]
  }
  // ... more suggestions if requested, up to ${count}
]
`;
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
    const maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || "2000", 10); // Increased max tokens for JSON output

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
      const modelOutputText = response.content[0].text.trim();
      console.log("Raw model output text:", modelOutputText); // For debugging
      try {
        // Attempt to parse the entire model output as JSON
        const parsedSuggestions = JSON.parse(modelOutputText);

        // Validate if it's an array and if elements have the expected structure
        if (Array.isArray(parsedSuggestions)) {
          suggestions = parsedSuggestions.filter(
            (item: any) =>
              item &&
              typeof item.name === 'string' &&
              typeof item.tagline === 'string' &&
              Array.isArray(item.suggestedDomains) &&
              item.suggestedDomains.every((d: any) => typeof d === 'string')
          ) as BrandNameSuggestion[];
        } else {
          console.error("Model output was not a JSON array as expected. Output:", modelOutputText);
        }
      } catch (jsonParseError: any) {
        console.error("Failed to parse model output as JSON:", jsonParseError.message);
        console.error("Model output that failed to parse:", modelOutputText);
        // Optionally, throw an HttpError to inform the client
        // throw new HttpError("Failed to parse brand suggestions from model output. Please try again.", 500);
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
