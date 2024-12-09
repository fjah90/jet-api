import { faker } from '@faker-js/faker';

export const CheckinMockedRepository = {
  createCheckin: jest.fn(() => {
    return true;
  }),
};

export const CheckinHeaderMocked = {
  seriesNumber: Number(faker.random.numeric(3)),
  confirmationNumber: faker.random.word(),
  reservationKey: `${faker.random.word()}:${faker.random.word()}`,
  logicalFlightKey: faker.random.word(),
  physicalFlightKey: faker.random.word(),
  customerKey: faker.random.word(),
};

export const CheckinPassengerMocked = {
  airLinePersonKey: `${faker.random.word()}:${faker.random.word()}`,
  seatAssignmentKey: `${faker.random.word()}:${faker.random.word()}`,
};

export const GetPostSendEmailMocked = {
  seriesNumber: Number(faker.random.numeric(3)),
  confirmationNumber: faker.random.word(),
};
