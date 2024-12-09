import { faker } from '@faker-js/faker';

export const MockedFareQuoteDto = {
  currencyCode: faker.datatype.string(),
  originCode: faker.datatype.string(),
  destinationCode: faker.datatype.string(),
  departureDate: faker.datatype.string(),
  seatsQuantity: faker.datatype.string(),
};

export const MockedFareQuoteRemoteRepository = {
  getFareQuoteRemote: jest.fn(async () => {
    return {
      ['s:Body']: { ['RetrieveFareQuoteResponse']: { ['RetrieveFareQuoteResult']: 'Correct' } },
    };
  }),
};
