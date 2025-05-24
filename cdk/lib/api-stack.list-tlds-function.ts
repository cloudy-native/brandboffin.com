import {
  Route53DomainsClient,
  ListPricesCommand,
  ListPricesCommandInput,
  // PriceWithCurrency, // This is part of DomainPrice, not directly used here
  // DomainPrice as AWSDomainPrice, // This is the type of elements in response.Prices
} from '@aws-sdk/client-route-53-domains';
import { createApiHandler, HttpError, CoreLambdaLogic } from "./lambda-utils";

// Initialize client outside the handler
const client = new Route53DomainsClient({});

// RequestBody is not applicable for this GET request with query params
// We'll access queryStringParameters directly from the payload passed to core logic

interface TldPriceInfo {
  tld: string;
  registrationPrice?: AssumedPriceWithCurrency;
  transferPrice?: AssumedPriceWithCurrency;
  renewalPrice?: AssumedPriceWithCurrency;
  // currency field is removed as it's now nested within each price type
}

interface ResponseBody {
  tlds: TldPriceInfo[];
}

// This is our assumption of the structure within the SDK's DomainPrice type
interface AssumedPriceWithCurrency {
  Price?: number;
  Currency?: string;
}

interface AssumedDomainPrice {
  Name?: string; // This is the TLD, e.g., "com"
  RegistrationPrice?: AssumedPriceWithCurrency;
  TransferPrice?: AssumedPriceWithCurrency; // Added based on AWS response
  RenewalPrice?: AssumedPriceWithCurrency;   // Added based on AWS response
  // Other prices like ChangeOwnershipPrice, RestorationPrice also exist but are not currently used
}

const listTldsLogic: CoreLambdaLogic<undefined, ResponseBody> = async (payload) => {
  const tldFilter = payload.queryStringParameters?.tld;
  console.log(`Listing TLD prices. Filter: ${tldFilter || 'none'}`);

  let marker: string | undefined = undefined;
  const allPrices: AssumedDomainPrice[] = [];
  const MAX_ITEMS = 1000; // Max allowed by the API

  try {
    do {
      const params: ListPricesCommandInput = { Marker: marker, MaxItems: MAX_ITEMS }; 
      const command = new ListPricesCommand(params);
      const response = await client.send(command);
      console.log(`ListPrices response received (marker: ${marker || 'initial'}). Prices in this page: ${response.Prices?.length || 0}`);

      if (response.Prices) {
        allPrices.push(...(response.Prices as AssumedDomainPrice[]));
      }
      marker = response.NextPageMarker;
    } while (marker);

    console.log(`Total prices fetched after pagination: ${allPrices.length}`);
    const tldPrices: TldPriceInfo[] = [];
    if (allPrices.length > 0) {
      for (const priceDetail of allPrices) {
        if (priceDetail.Name) { // We only strictly need Name; prices can be optional
          if (tldFilter && priceDetail.Name.toLowerCase() !== tldFilter.toLowerCase()) {
            continue; 
          }
          tldPrices.push({
            tld: priceDetail.Name,
            registrationPrice: priceDetail.RegistrationPrice ? { 
              Price: priceDetail.RegistrationPrice.Price, 
              Currency: priceDetail.RegistrationPrice.Currency 
            } : undefined,
            transferPrice: priceDetail.TransferPrice ? { 
              Price: priceDetail.TransferPrice.Price, 
              Currency: priceDetail.TransferPrice.Currency 
            } : undefined,
            renewalPrice: priceDetail.RenewalPrice ? { 
              Price: priceDetail.RenewalPrice.Price, 
              Currency: priceDetail.RenewalPrice.Currency 
            } : undefined,
          });
        }
      }
    }
    
    tldPrices.sort((a, b) => a.tld.localeCompare(b.tld));
    return { tlds: tldPrices };

  } catch (error: any) {
    console.error('Error listing TLD prices:', error.message, error);
    throw new HttpError(error.message || 'Failed to list TLD prices', 500);
  }
};

export const handler = createApiHandler<undefined, ResponseBody>(
  listTldsLogic,
  {
    allowedMethods: ['GET'],
    isBodyRequired: false, // GET requests don't have a body
  }
);
