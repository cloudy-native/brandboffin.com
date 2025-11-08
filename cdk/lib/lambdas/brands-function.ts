import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type {
  BrandNameSuggestion,
  BrandNameSuggestionRequest,
  BrandNameSuggestionResponse,
} from "../../../common/types";
import {
  type CoreLambdaLogic,
  createApiHandler,
  HttpError,
} from "./utils/lambda-utils";

// Initialize Bedrock client outside the handler for reuse (uses Lambda IAM role)
let bedrockClient: BedrockRuntimeClient | undefined;
function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    const region =
      process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    bedrockClient = new BedrockRuntimeClient({ region });
  }
  return bedrockClient;
}

function constructBrandPrompt(
  request: BrandNameSuggestionRequest,
  defaultCount: number,
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
1.  Brand Name: Memorable, distinct, easy to spell and pronounce, relevant to the core idea and style. Differentiated if an industry is provided.
2.  Tagline: Concise (3-7 words), compelling, capturing the brand's essence, complementing the brand name.
3.  Suggested Domains: An array of 3-5 relevant domain name suggestions (e.g., brandname.com, getbrandname.io, brandname.ai). Include a mix of common and creative TLDs. Only include valid and relevant TLDs.

Output Format:
VERY IMPORTANT: Provide the entire response as a single, valid JSON array. Each element in the array should be an object with the following keys: "name" (string), "tagline" (string), and "suggestedDomains" (array of strings). Do not include any text outside of this JSON array.
`;
  return fullPrompt;
}

const brandNameSuggesterLogic: CoreLambdaLogic<
  BrandNameSuggestionRequest,
  BrandNameSuggestionResponse
> = async payload => {
  if (
    !payload.body ||
    !payload.body.prompt ||
    typeof payload.body.prompt !== "string" ||
    !payload.body.prompt.trim()
  ) {
    throw new HttpError(
      "Prompt is required and must be a non-empty string",
      400,
    );
  }

  const requestBody = payload.body;
  const requestedCount = requestBody.count || 6; // Default to 5 suggestions

  const client = getBedrockClient();
  const modelId = process.env.MODEL_ID || "amazon.nova-premier-v1:0";
  const temperature = parseFloat(process.env.MODEL_TEMPERATURE || "0.7");
  const maxTokens = parseInt(process.env.MODEL_MAX_TOKENS || "2000", 10);
  const userPromptContent = constructBrandPrompt(requestBody, requestedCount);

  console.log("Constructed user prompt for model:", userPromptContent);

  try {
    const messages = [
      {
        role: "user" as const,
        content: [{ text: userPromptContent }],
      },
    ];

    const system = [
      {
        text: "You are 'BrandSpark', a world-class AI branding assistant. Be creative, precise, and output only a single valid JSON array as specified.",
      },
    ];

    const response = await client.send(
      new ConverseCommand({
        modelId,
        messages,
        system,
        inferenceConfig: {
          maxTokens,
          temperature,
          topP: 0.9,
          stopSequences: [],
        },
        // performanceConfig and additionalModelRequestFields can be set via env if needed
      }),
    );

    console.log("Bedrock Converse response received.");

    let suggestions: BrandNameSuggestion[] = [];
    const modelOutputText = (
      response?.output?.message?.content?.find(
        (c: any) => typeof c?.text === "string",
      )?.text || ""
    ).trim();
    interface PotentialSuggestion {
      name?: unknown;
      tagline?: unknown;
      suggestedDomains?: unknown;
      [key: string]: unknown;
    }
    try {
      const parsedOutput = JSON.parse(modelOutputText) as unknown;

      if (Array.isArray(parsedOutput)) {
        suggestions = parsedOutput.filter(
          (item: unknown): item is BrandNameSuggestion => {
            const potentialItem = item as PotentialSuggestion;
            return (
              potentialItem != null &&
              typeof potentialItem.name === "string" &&
              typeof potentialItem.tagline === "string" &&
              Array.isArray(potentialItem.suggestedDomains) &&
              potentialItem.suggestedDomains.every(
                (d: unknown) => typeof d === "string",
              )
            );
          },
        );
      } else {
        console.error(
          "Model output was not a JSON array as expected. Output:",
          modelOutputText,
        );
      }
    } catch (jsonParseError: unknown) {
      let errorMsg = "Unknown JSON parsing error";
      if (jsonParseError instanceof Error) {
        errorMsg = jsonParseError.message;
      }
      console.error("Failed to parse model output as JSON:", errorMsg);
      console.error("Model output that failed to parse:", modelOutputText);
      // Optionally, throw an HttpError to inform the client
      // throw new HttpError("Failed to parse brand suggestions from model output. Please try again.", 500);
    }
    return { suggestions };
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";
    let errorStatus = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Attempt to get status if it exists, common in HTTP related errors
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
    ) {
      errorStatus = error.status;
    }

    console.error("Error calling Bedrock model:", errorMessage, error);
    // Check for specific Anthropic error types if available/needed
    // e.g., if (error instanceof Anthropic.APIError) { ... }
    // If error is already an HttpError, it might be better to rethrow it or handle its properties directly.
    // For now, we construct a new HttpError based on extracted message and status.
    throw new HttpError(
      errorMessage || "Failed to generate brand name suggestions",
      errorStatus,
    );
  }
};

export const handler = createApiHandler<
  BrandNameSuggestionRequest,
  BrandNameSuggestionResponse
>(brandNameSuggesterLogic, {
  allowedMethods: ["POST"],
  isBodyRequired: true,
});
