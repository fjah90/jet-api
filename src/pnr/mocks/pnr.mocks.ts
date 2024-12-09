import { faker } from '@faker-js/faker';
import { AvailableCurrencies } from 'src/currencies/interfaces/currencies-enum';
import { CreatePnrRequest } from '../dto/create-pnr-request.dto';

export const MockedPnrRemoteRepository = {
  createPnr: jest.fn(async ({ reservationInfo }: CreatePnrRequest) => {
    if (typeof reservationInfo.seriesNumber === 'number') return true;
    return false;
  }),
  modifyPnr: jest.fn(async () => true),
};

export const MockedPnrConverter = {
  updatePassengerInformation: jest.fn(async () => faker.datatype.string()),
  addSpecialServices: jest.fn(async () => faker.datatype.string()),
};

export const MockedPassenger = {
  orgID: faker.datatype.string(),
  firstName: faker.datatype.string(),
  lastName: faker.datatype.string(),
  middleName: faker.datatype.string(),
  age: faker.datatype.number(),
  DOB: faker.datatype.string(),
  gender: faker.datatype.string(),
  title: faker.datatype.string(),
  nationalityLaguageID: faker.datatype.string(),
  relationType: faker.datatype.string(),
  WBCID: faker.datatype.string(),
  PTCID: faker.datatype.string(),
  PTC: faker.datatype.string(),
  useInventory: faker.datatype.string(),
  company: faker.datatype.string(),
  comments: faker.datatype.string(),
  passport: faker.datatype.string(),
  nationality: faker.datatype.string(),
  profileId: faker.datatype.string(),
  weight: faker.datatype.string(),
  height: faker.datatype.string(),
  redressNumber: faker.datatype.string(),
  knownTravelerNumber: faker.datatype.string(),
  frequentFlyerNumber: faker.datatype.string(),
  address: {
    address1: faker.datatype.string(),
    address2: faker.datatype.string(),
    city: faker.datatype.string(),
    state: faker.datatype.string(),
    postalCode: faker.datatype.string(),
    countryName: faker.datatype.string(),
    countryCode: faker.datatype.string(),
    areaCode: faker.datatype.string(),
    phoneNumber: faker.datatype.string(),
    display: faker.datatype.string(),
  },
};

export const MockedServices = {
  codeType: faker.datatype.string(),
  serviceId: faker.datatype.number(),
  ssrCategory: faker.datatype.number(),
  logicalFlightId: faker.datatype.number(),
  departureDate: faker.datatype.string(),
  amount: faker.datatype.number(),
  overrideAmount: faker.datatype.boolean(),
  currencyCode: AvailableCurrencies.USD,
  chargeComment: faker.datatype.boolean(),
  personOrgId: faker.datatype.number(),
  comment: {
    commentID: faker.datatype.number(),
    commentMessage: faker.datatype.string(),
  },
};
