import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckinService } from '../services';
import { CheckinRemoteRepository } from '../repositories';
import { CheckinHeaderMocked, CheckinPassengerMocked, GetPostSendEmailMocked } from './mocks/checkin.service.mocks';
import { AuthService } from 'src/auth/auth.service';
import { ReservationService } from 'src/reservations/reservation.service';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrismicService } from 'src/prismic/services';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { MockedAuthService, AuthMockedRepository } from 'src/auth/mocks/auth.mocks';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { MockedPrismicRemoteRepository } from 'src/prismic/mocks/prismic.mocks';
import { MockedReservationService } from 'src/reservations/mocks/reservation.mocks';
import { ReservationMockRepository } from 'src/reservations/test/mocks/reservation.service.mocks';

describe('CheckinService', () => {
  let checkinService: CheckinService;
  const remoteRepository = {
    createCheckin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckinService,
        { provide: AuthService, useValue: MockedAuthService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
        { provide: ReservationService, useValue: MockedReservationService },
        { provide: ReservationRemoteRepository, useValue: ReservationMockRepository },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository },
        {
          provide: CheckinRemoteRepository,
          useValue: remoteRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key) {
                return key;
              }
              return null;
            }),
          },
        },
      ],
    }).compile();
    checkinService = module.get<CheckinService>(CheckinService);
  });

  it('should be defined', () => {
    expect(checkinService).toBeDefined();
  });

  it('should create a checkin', async () => {
    const mockCreateCheckinPayload = {
      ...CheckinHeaderMocked,
      passengers: [CheckinPassengerMocked],
    };
    const mockResponse = 'Successful Transaction';
    remoteRepository.createCheckin.mockResolvedValue(mockResponse);
    const response = await checkinService.createCheckin(mockCreateCheckinPayload);
    expect(response).toEqual(mockResponse);
    expect(remoteRepository.createCheckin).toHaveBeenCalledTimes(1);
  });

  it('should get post send email', async () => {
    const mockGetPostSendEmailPayload = {
      ...GetPostSendEmailMocked,
    };
    const response = await checkinService.postSendEmail(mockGetPostSendEmailPayload);
    expect(response).toMatch(
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/
    );
  });
});
