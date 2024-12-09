import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { MockedAuthService, AuthMockedRepository } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { MockedPrismicRemoteRepository } from 'src/prismic/mocks/prismic.mocks';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { MockedReservationService } from 'src/reservation/mocks/reservation.mocks';
import { ReservationRemoteRepository } from 'src/reservation/reservation.remote-repository';
import { ReservationService } from 'src/reservation/reservation.service';
import { ReservationMockRepository } from 'src/reservation/test/mocks/reservation.service.mocks';
import { CheckinController } from '../controllers';
import { CheckinRemoteRepository } from '../repositories';
import { CheckinService } from '../services';
import { CheckinMockedRepository } from './mocks/checkin.service.mocks';

describe('CheckinController', () => {
  let controller: CheckinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        CheckinService,
        { provide: CheckinRemoteRepository, useValue: CheckinMockedRepository },
        { provide: AuthService, useValue: MockedAuthService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
        { provide: ReservationService, useValue: MockedReservationService },
        { provide: ReservationRemoteRepository, useValue: ReservationMockRepository },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository },
      ],
      controllers: [CheckinController],
    }).compile();

    controller = module.get<CheckinController>(CheckinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
