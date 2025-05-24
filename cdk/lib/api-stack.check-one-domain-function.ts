import { AWSRoute53DomainChecker, DomainCheckResult } from "./aws-domains";
import { createApiHandler, HttpError, CoreLambdaLogic } from "./lambda-utils";

interface RequestBody {
  domain: string;
}

interface ResponseBody {
  result: DomainCheckResult;
}

const checkOneDomainLogic: CoreLambdaLogic<RequestBody, ResponseBody> = async (payload) => {
  if (!payload.body || !payload.body.domain || typeof payload.body.domain !== 'string' || !payload.body.domain.trim()) {
    throw new HttpError("Domain is required and must be a non-empty string", 400);
  }
  const { domain } = payload.body;
  console.log("Domain to check:", domain);

  try {
    const checker = new AWSRoute53DomainChecker();
    const result = await checker.checkDomain(domain);
    return { result };
  } catch (error: any) {
    console.error(`Error checking domain ${domain}:`, error);
    // Assuming checkDomain might throw an error that we want to surface with a 500
    // Or, if checker.checkDomain throws a specific type of error, handle it here
    throw new HttpError(error.message || 'Failed to check domain availability.', 500);
  }
};

export const handler = createApiHandler<RequestBody, ResponseBody>(
  checkOneDomainLogic,
  {
    allowedMethods: ['POST'],
    isBodyRequired: true,
  }
);
