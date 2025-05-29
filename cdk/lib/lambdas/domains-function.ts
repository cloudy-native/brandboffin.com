import { DomainCheckRequest, DomainCheckResponse } from "../../../common/types";
import { AWSDomainUtils } from "./utils/aws-domain-utils";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./utils/lambda-utils";

const awsDomainUtils = new AWSDomainUtils();

const checkOneDomainLogic: CoreLambdaLogic<
  DomainCheckRequest,
  DomainCheckResponse
> = async (payload) => {
  const rawDomainName = payload.queryStringParameters?.domainName;
  let sanitizedDomainName: string;

  if (typeof rawDomainName === 'string' && rawDomainName.trim() !== '') {
    sanitizedDomainName = rawDomainName
      .toLowerCase()                         // Convert to lowercase
      .trim()                                // Trim leading/trailing whitespace
      .replace(/\s+/g, '')                   // Remove all internal spaces (e.g., "my domain.com" -> "mydomain.com")
      .replace(/[^a-z0-9.-]/g, '');        // Remove characters not valid in domain names (keeps alphanumeric, dots, hyphens)
                                           // Example: " My-Test Domain!.com " -> "my-testdomain.com"
  } else {
    sanitizedDomainName = ""; // Ensure it's an empty string if input is invalid/empty or only whitespace
  }
  
  if (!sanitizedDomainName) {
    throw new HttpError(
      "Domain name is required, must be a non-empty string, and must resolve to a valid format after sanitization.",
      400
    );
  }
  console.log("Sanitized domain to check:", sanitizedDomainName);

  try {
    const result = await awsDomainUtils.checkDomain(sanitizedDomainName);
    return { result };
  } catch (error: any) {
    console.error(`Error in checkOneDomainLogic for ${sanitizedDomainName}:`, error.message);
    // If the error message indicates an invalid domain/TLD (from the refined aws-domain-utils),
    // return a 400 error. Otherwise, default to 500.
    if (error.message && error.message.toLowerCase().includes("invalid domain name or tld")) {
      throw new HttpError(error.message, 400);
    } else {
      throw new HttpError(
        error.message || "An unexpected error occurred while checking domain availability.",
        500
      );
    }
  }
};

export const handler = createApiHandler<DomainCheckRequest, DomainCheckResponse>(
  checkOneDomainLogic,
  {
    allowedMethods: ["GET"],
    isBodyRequired: false,
  }
);
