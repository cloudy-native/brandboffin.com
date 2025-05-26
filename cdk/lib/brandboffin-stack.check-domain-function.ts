import { DomainCheckRequest, DomainCheckResponse } from "../../common/types";
import { AWSDomainUtils } from "./aws-domain-utils";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./lambda-utils";

const awsDomainUtils = new AWSDomainUtils();

const checkOneDomainLogic: CoreLambdaLogic<
  DomainCheckRequest,
  DomainCheckResponse
> = async (payload) => {
  if (
    !payload.body ||
    !payload.body.domainName ||
    typeof payload.body.domainName !== "string" ||
    !payload.body.domainName.trim()
  ) {
    throw new HttpError(
      "Domain name is required and must be a non-empty string",
      400
    );
  }
  const { domainName } = payload.body;
  console.log("Domain to check:", domainName);

  try {
    const result = await awsDomainUtils.checkDomain(domainName);
    return { result };
  } catch (error: any) {
    console.error(`Error checking domain ${domainName}:`, error);
    throw new HttpError(
      error.message || "Failed to check domain availability.",
      500
    );
  }
};

export const handler = createApiHandler<DomainCheckRequest, DomainCheckResponse>(
  checkOneDomainLogic,
  {
    allowedMethods: ["POST"],
    isBodyRequired: true,
  }
);
