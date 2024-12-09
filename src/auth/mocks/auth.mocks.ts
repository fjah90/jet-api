import { faker } from '@faker-js/faker';
import { User, UserCredential } from 'firebase/auth';

export const MOCKED_USER_CREDENTIAL: UserCredential = {
  user: {} as User,
  providerId: faker.datatype.string(),
  operationType: faker.helpers.arrayElement(['link', 'reauthenticate', 'signIn']),
};

export const AuthMockedRepository = {
  retrieveSecurityToken: jest.fn(() => {
    return faker.datatype.string();
  }),
  validateSecurityToken: jest.fn(() => {
    return true;
  }),
};

export const MockedAuthService = {
  retrieveSecurityToken: jest.fn(() => {
    return faker.datatype.string();
  }),
  validateSecurityToken: jest.fn(() => {
    return true;
  }),
};
