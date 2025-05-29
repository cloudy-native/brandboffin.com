import {
  BatchDomainCheckRequest,
  BatchDomainCheckResponse,
} from "../../../common/types";
import { AWSDomainUtils } from "./utils/aws-domain-utils";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./utils/lambda-utils";

const awsDomainUtils = new AWSDomainUtils();

const checkBatchDomainsLogic: CoreLambdaLogic<
  BatchDomainCheckRequest,
  BatchDomainCheckResponse
> = async (payload) => {
  if (
    !payload.body ||
    !Array.isArray(payload.body.domains) ||
    payload.body.domains.length === 0
  ) {
    throw new HttpError("Domains array is required and must not be empty", 400);
  }
  if (payload.body.domains.some((d) => typeof d !== "string" || !d.trim())) {
    throw new HttpError(
      "All domains in the array must be non-empty strings",
      400
    );
  }

  const { domains, delayMs } = payload.body;
  console.log(
    `Domains to check: ${domains.join(", ")}, delay: ${delayMs || "default"}`
  );

  try {
    const results = await awsDomainUtils.checkDomains(domains, delayMs);
    return { results };
  } catch (error: any) {
    console.error(`Error checking batch domains:`, error);
    throw new HttpError(error.message || "Failed to check batch domains.", 500);
  }
};

export const handler = createApiHandler<BatchDomainCheckRequest, BatchDomainCheckResponse>(
  checkBatchDomainsLogic,
  {
    allowedMethods: ["POST"],
    isBodyRequired: true,
  }
);
