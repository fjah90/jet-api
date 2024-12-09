import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { ReservationRemoteRepository } from '../reservation.remote-repository';
import { ReservationService } from '../reservation.service';
import { authMockService, ReservationMockRepository } from './mocks/reservation.service.mocks';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { MockedPrismicRemoteRepository } from 'src/prismic/mocks/prismic.mocks';

describe('ReservationService', () => {
  let service: ReservationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: ReservationRemoteRepository, useValue: ReservationMockRepository },
        { provide: AuthService, useValue: authMockService },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
        { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve a reservation', async () => {
    const response = await service.getReservation({
      confirmationNumber: faker.datatype.string(),
      seriesNumber: faker.datatype.number(),
    });
    expect(response).toBeDefined();
    expect(ReservationMockRepository.retrievePnr).toBeCalledTimes(1);
  });
});
