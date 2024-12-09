import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository, MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { MockedReservationRemoteRepository, MockedReservationService } from 'src/reservation/mocks/reservation.mocks';
import { ReservationRemoteRepository } from 'src/reservation/reservation.remote-repository';
import { ReservationService } from 'src/reservation/reservation.service';
import { MockedPassenger, MockedPnrConverter, MockedPnrRemoteRepository, MockedServices } from '../mocks/pnr.mocks';
import { PnrConverter } from '../pnr.converter';
import { PnrRemoteRepository } from '../pnr.remote-repository';
import { PnrService } from '../pnr.service';

describe('PnrService', () => {
  let service: PnrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PnrService,
        { provide: PnrConverter, useValue: MockedPnrConverter },
        { provide: AuthService, useValue: MockedAuthService },
        { provide: PnrRemoteRepository, useValue: MockedPnrRemoteRepository },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
        { provide: ReservationService, useValue: MockedReservationService },
        { provide: ReservationRemoteRepository, useValue: MockedReservationRemoteRepository },
      ],
    }).compile();

    service = module.get<PnrService>(PnrService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a correct response.', async () => {
    const response = await service.createPnr({
      reservationInfo: { confirmationNumber: faker.datatype.string(), seriesNumber: faker.datatype.number() },
    });
    expect(response).toEqual(true);
    expect(MockedPnrRemoteRepository.createPnr).toBeCalledTimes(1);
  });

  it('should return a correct response.', async () => {
    await service.updatePassengersInfo({
      confirmationNumber: faker.datatype.string(),
      seriesNumber: faker.datatype.number(),
      passengers: [MockedPassenger],
    });
    expect(MockedPnrRemoteRepository.modifyPnr).toBeCalledTimes(1);
  });

  it('should return a correct response.', async () => {
    const response = await service.addSpecialServices({
      confirmationNumber: faker.datatype.string(),
      seriesNumber: faker.datatype.number(),
      specialServices: [MockedServices],
    });
    expect(response).toEqual(true);
    expect(MockedPnrRemoteRepository.modifyPnr).toBeCalledTimes(1);
    expect(MockedPnrRemoteRepository.createPnr).toBeCalledTimes(1);
  });
});
