import { Anthropic } from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { SuggestionRequest, SuggestionResponse } from "../../common/types";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./lambda-utils";

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
  request: SuggestionRequest,
  defaultCount: number
): string {
  const {
    prompt,
    industry,
    style,
    keywords,
    length,
    count = defaultCount,
  } = request;
  let fullPrompt = `Generate ${count} brand name suggestions based on the following criteria:\n- Core idea/prompt: ${prompt}\n`;
  if (industry) fullPrompt += `- Industry: ${industry}\n`;
  if (style) fullPrompt += `- Style: ${style}\n`;
  if (keywords && keywords.length > 0)
    fullPrompt += `- Keywords: ${keywords.join(", ")}\n`;
  if (length) fullPrompt += `- Desired length (approx characters): ${length}\n`;
  fullPrompt += `\nPlease provide only the brand names, each on a new line, without any additional text or numbering. The response should be a list of names.`;
  return fullPrompt;
}

const brandNameSuggesterLogic: CoreLambdaLogic<
  SuggestionRequest,
  SuggestionResponse
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
    "You are an expert brand name generator. Your task is to provide creative and relevant brand name suggestions based on user input. Output only the names, each on a new line.";
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

    let suggestions: string[] = [];
    if (
      response.content &&
      response.content.length > 0 &&
      response.content[0].type === "text"
    ) {
      suggestions = response.content[0].text
        .split("\n")
        .map((s) => s.trim())
        .filter(
          (s) =>
            s.length > 0 &&
            !s.startsWith("Here are") &&
            !s.startsWith("Okay, here") &&
            !s.match(/^\d+\.\s/)
        ); // Filter out common conversational fluff and numbered lists
    }

    suggestions = suggestions.slice(0, requestedCount);
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

export const handler = createApiHandler<SuggestionRequest, SuggestionResponse>(
  brandNameSuggesterLogic,
  {
    allowedMethods: ["POST"],
    isBodyRequired: true,
  }
);
