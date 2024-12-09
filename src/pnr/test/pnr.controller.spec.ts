import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository, MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { MockedReservationRemoteRepository, MockedReservationService } from 'src/reservation/mocks/reservation.mocks';
import { ReservationRemoteRepository } from 'src/reservation/reservation.remote-repository';
import { ReservationService } from 'src/reservation/reservation.service';
import { MockedPnrConverter, MockedPnrRemoteRepository } from '../mocks/pnr.mocks';
import { PnrController } from '../pnr.controller';
import { PnrConverter } from '../pnr.converter';
import { PnrRemoteRepository } from '../pnr.remote-repository';
import { PnrService } from '../pnr.service';

describe('PnrController', () => {
  let controller: PnrController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PnrController],
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

    controller = module.get<PnrController>(PnrController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
