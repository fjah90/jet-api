import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { MockedPrismicRemoteRepository } from 'src/prismic/mocks/prismic.mocks';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { ReservationController } from '../reservation.controller';
import { ReservationRemoteRepository } from '../reservation.remote-repository';
import { ReservationService } from '../reservation.service';
import { authMockService, ReservationMockRepository } from './mocks/reservation.service.mocks';

describe('ReservationController', () => {
  let controller: ReservationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [
        ReservationService,
        { provide: ReservationRemoteRepository, useValue: ReservationMockRepository },
        { provide: AuthService, useValue: authMockService },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
        { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository },
        ,
      ],
    }).compile();

    controller = module.get<ReservationController>(ReservationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
