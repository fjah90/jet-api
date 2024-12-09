import { AvailableCurrencies } from 'src/currencies/interfaces/currencies-enum';

export interface SpecialServices {
  codeType: string;
  serviceId: number;
  ssrCategory: number;
  logicalFlightId: number;
  departureDate: string;
  amount: number;
  overrideAmount: boolean;
  currencyCode: AvailableCurrencies;
  commissionable?: boolean;
  refundable?: boolean;
  chargeComment: boolean;
  personOrgId: number;
  physicalFlightID?: string;
  overrideAmtReason?: boolean;
  extPenaltyRule?: boolean;
  extIsRePriceFixed?: boolean;
  extRePriceSourceName?: boolean;
  extRePriceValue?: boolean;
  extRePriceValueReason?: boolean;
  serviceBundleCode?: boolean;
  comment: {
    commentID: number;
    commentMessage: string;
  };
}
