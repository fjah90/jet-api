
export interface FareQuoteRangeDto {
    LFID: string;
    departureDate: string;
    lowestFarePrice: number;
}

export interface FlightSegmentDto {
    LFID: string;
    departureDate: string;
    fareTypes: {
        fareType: {
            fareInfos: {
                fareInfo: {
                    fareAmt: string;
                }[];
            };
        }[];
    };
}