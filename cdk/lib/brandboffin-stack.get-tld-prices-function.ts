import { AWSDomainUtils } from "./aws-domain-utils";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./lambda-utils";
import { GetTLDPricesRequest, GetTLDPricesResponse } from "../../common/types";

const awsDomainUtils = new AWSDomainUtils();

const getTLDPricesLogic: CoreLambdaLogic<
  GetTLDPricesRequest,
  GetTLDPricesResponse
> = async (payload) => {
  const tld = payload.body?.tld as string | undefined;

  console.log(`Fetching TLD prices via POST. Filter TLD: ${tld || "all"}`);
  console.log("Request body:", payload.body);

  try {
    const prices = await awsDomainUtils.getTLDPrices(tld);
    if (!prices) {
      throw new HttpError(
        "Failed to fetch TLD prices due to an internal error.",
        500
      );
    }
    return { prices };
  } catch (error: any) {
    console.error(`Error fetching TLD prices (TLD: ${tld || "all"}):`, error);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(error.message || "Failed to fetch TLD prices.", 500);
  }
};

export const handler = createApiHandler<
  GetTLDPricesRequest,
  GetTLDPricesResponse
>(getTLDPricesLogic, {
  allowedMethods: ["POST"],
  isBodyRequired: true,
});
