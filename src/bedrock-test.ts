import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  InvokeModelWithResponseStreamCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize the Bedrock Runtime client
const client = new BedrockRuntimeClient({
  region: "us-east-1", // Change to your preferred region
  // Credentials will be automatically picked up from:
  // - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // - IAM roles (if running on EC2/Lambda)
  // - AWS credentials file
});

async function callBedrockModel() {
  try {
    // Example using Claude 3 Sonnet
    const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";

    // Prepare the request payload
    const prompt = "Explain quantum computing in simple terms.";

    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    // Create the command
    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    // Call the model
    const response = await client.send(command);

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    console.log("Model Response:");
    console.log(responseBody.content[0].text);

    return responseBody;
  } catch (error) {
    console.error("Error calling Bedrock model:", error);
    throw error;
  }
}

// Alternative example for Amazon Titan Text model
async function callTitanModel() {
  try {
    const modelId = "amazon.titan-text-express-v1";

    const requestBody = {
      inputText: "Write a short story about a robot.",
      textGenerationConfig: {
        maxTokenCount: 500,
        temperature: 0.7,
        topP: 0.9,
      },
    };

    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    console.log("Titan Response:");
    console.log(responseBody.results[0].outputText);

    return responseBody;
  } catch (error) {
    console.error("Error calling Titan model:", error);
    throw error;
  }
}

// Example for streaming responses (Claude models)
async function callBedrockModelStreaming() {
  try {
    const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";

    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: "Tell me a joke about programming.",
        },
      ],
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = (await client.send(
      command
    )) as InvokeModelWithResponseStreamCommandOutput;

    // Process the streaming response
    if (response.body) {
      // Check if body exists before iterating
      for await (const chunk of response.body) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const data = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
          if (
            data.type === "content_block_delta" &&
            data.delta &&
            data.delta.text
          ) {
            process.stdout.write(data.delta.text);
          }
        }
      }
    } // Closes if (response.body)
  } catch (error) {
    console.error("Error with streaming:", error);
    throw error;
  }
}

// Usage examples
async function main() {
  console.log("Calling Claude model...");
  await callBedrockModel();

  console.log("\n---\n");

  console.log("Calling Titan model...");
  await callTitanModel();

  console.log("\n---\n");

  console.log("Streaming response from Claude:");
  await callBedrockModelStreaming();
}

// Uncomment to run
main().catch(console.error);

module.exports = {
  callBedrockModel,
  callTitanModel,
  callBedrockModelStreaming,
};
