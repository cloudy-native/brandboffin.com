import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  BrandNameSuggestionRequest,
  BrandNameSuggestionResponse,
  BrandNameSuggestion,
} from "../../../common/types";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./utils/lambda-utils";

const bedrockClient = new BedrockRuntimeClient({});

function constructClaudePrompt(
  request: BrandNameSuggestionRequest,
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

  let fullPrompt = `Your goal is to generate ${count} unique and creative brand name and tagline pairs.\n\nConsider the following criteria carefully:\n- Core Idea/Description: ${prompt}\n`;

  if (industry) fullPrompt += `- Industry: ${industry}\n`;
  if (style) fullPrompt += `- Desired Style/Vibe: ${style}\n`;
  if (keywords && keywords.length > 0) {
    fullPrompt += `- Key Themes/Keywords to incorporate or allude to: ${keywords.join(", ")}\n`;
  }
  if (length) {
    fullPrompt += `- Target Brand Name Length: Approximately ${length} characters. Shorter is often better if it's impactful.\n`;
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
`;
  return fullPrompt;
}

const brandNameSuggesterLogicBedrock: CoreLambdaLogic<
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
  const requestedCount = requestBody.count || 6;

  const systemPromptContent =
    "You are 'BrandSpark', a world-class AI branding assistant. Your expertise lies in crafting unique brand names and impactful taglines. You are highly creative, pay close attention to user requirements, and strictly adhere to the requested output format.";
  const userPromptContent = constructClaudePrompt(requestBody, requestedCount);

  console.log("Constructed user prompt for Bedrock (Claude model):", userPromptContent);

  try {
    const bedrockModelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";
    const temperature = parseFloat(process.env.BEDROCK_TEMPERATURE || "0.7");
    const maxTokens = parseInt(process.env.BEDROCK_MAX_TOKENS || "2000", 10); // Increased default for potentially more suggestions

    const bedrockRequestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPromptContent,
      messages: [
        { role: "user", content: userPromptContent },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: bedrockModelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(bedrockRequestBody),
    });

    console.log(`Sending request to Bedrock model: ${bedrockModelId}`);
    const response = await bedrockClient.send(command);
    console.log("Bedrock API response received.");

    const decodedResponseBody = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(decodedResponseBody);

    let suggestions: BrandNameSuggestion[] = [];
    if (
      parsedResponse.content &&
      parsedResponse.content.length > 0 &&
      parsedResponse.content[0].type === "text"
    ) {
      const text = parsedResponse.content[0].text.trim();
      const pairs = text.split(/\n\s*\n/); // Split by blank lines between pairs
      for (const pair of pairs) {
        const lines = pair.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        let name = "";
        let tagline = "";
        if (lines.length >= 2) {
          const nameLine = lines.find((l: string) => l.startsWith("Brand Name:"));
          const taglineLine = lines.find((l: string) => l.startsWith("Tagline:"));
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

    suggestions = suggestions.slice(0, requestedCount);
    console.log("Returning suggestions:", suggestions);

    return { suggestions };
  } catch (error: any) {
    console.error("Error calling Bedrock API:", error.message, error);
    // Consider more specific error handling for Bedrock errors if needed
    throw new HttpError(
      error.message || "Failed to generate brand name suggestions via Bedrock",
      error.$metadata?.httpStatusCode || 500 // Use Bedrock's status code if available
    );
  }
};

export const handler = createApiHandler<BrandNameSuggestionRequest, BrandNameSuggestionResponse>(
  brandNameSuggesterLogicBedrock,
  {
    allowedMethods: ["POST"],
    isBodyRequired: true,
  }
);
