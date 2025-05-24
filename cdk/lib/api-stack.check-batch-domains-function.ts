import { AWSRoute53DomainChecker, DomainCheckResult } from "./aws-domains";
import { createApiHandler, HttpError, CoreLambdaLogic } from "./lambda-utils";

interface RequestBody {
  domains: string[];
  delayMs?: number; // Optional delay between checks
}

interface ResponseBody {
  results: DomainCheckResult[]; // Note: API spec was 'result', changing to 'results' for plurality
}

const checkBatchDomainsLogic: CoreLambdaLogic<RequestBody, ResponseBody> = async (payload) => {
  if (!payload.body || !Array.isArray(payload.body.domains) || payload.body.domains.length === 0) {
    throw new HttpError("Domains array is required and must not be empty", 400);
  }
  if (payload.body.domains.some(d => typeof d !== 'string' || !d.trim())) {
    throw new HttpError("All domains in the array must be non-empty strings", 400);
  }

  const { domains, delayMs } = payload.body;
  console.log(`Domains to check: ${domains.join(', ')}, delay: ${delayMs || 'default'}`);

  try {
    const checker = new AWSRoute53DomainChecker();
    // The checkDomains method in aws-domains.ts already handles potential errors for individual domains
    // and returns them in the DomainCheckResult. So, the main error here would be an unexpected system error.
    const results = await checker.checkDomains(domains, delayMs); 
    return { results };
  } catch (error: any) {
    console.error(`Error checking batch domains:`, error);
    throw new HttpError(error.message || 'Failed to check batch domains.', 500);
  }
};

export const handler = createApiHandler<RequestBody, ResponseBody>(
  checkBatchDomainsLogic,
  {
    allowedMethods: ['POST'],
    isBodyRequired: true,
  }
);
