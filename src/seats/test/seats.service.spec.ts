import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository, MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { MockedPnrRemoteRepository } from 'src/pnr/mocks/pnr.mocks';
import { PnrRemoteRepository } from 'src/pnr/pnr.remote-repository';
import { MockedPrismicRemoteRepository } from 'src/prismic/mocks/prismic.mocks';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { MockedReservationService } from 'src/reservation/mocks/reservation.mocks';
import { ReservationRemoteRepository } from 'src/reservation/reservation.remote-repository';
import { ReservationService } from 'src/reservation/reservation.service';
import { ReservationMockRepository } from 'src/reservation/test/mocks/reservation.service.mocks';
import { SeatsService } from '../seats.service';

describe('SeatsService', () => {
  let service: SeatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatsService,
        { provide: AuthService, useValue: MockedAuthService },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
        { provide: ReservationService, useValue: MockedReservationService },
        { provide: ReservationRemoteRepository, useValue: ReservationMockRepository },
        { provide: PnrRemoteRepository, useValue: MockedPnrRemoteRepository },
        { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository },
      ],
    }).compile();

    service = module.get<SeatsService>(SeatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve a correct answer', () => {});
});
