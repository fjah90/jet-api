import { faker } from '@faker-js/faker';

export const ReservationMockRepository = {
  retrievePnr: jest.fn(() => {
    return true;
  }),
};

export const authMockService = {
  validateSecurityToken: jest.fn(() => {
    return true;
  }),
  retrieveSecurityToken: jest.fn(() => {
    return faker.datatype.string();
  }),
};
