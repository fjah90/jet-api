import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository, MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { FareQuotesRemoteRepository } from '../fare-quotes.remote-repository';
import { FareQuotesService } from '../fare-quotes.service';
import { MockedFareQuoteDto, MockedFareQuoteRemoteRepository } from '../mocks/fare-quotes.mocks';

describe('FareQuotesService', () => {
  let service: FareQuotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FareQuotesService,
        { provide: FareQuotesRemoteRepository, useValue: MockedFareQuoteRemoteRepository },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthService, useValue: MockedAuthService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
      ],
    }).compile();

    service = module.get<FareQuotesService>(FareQuotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve a correct answer', async () => {
    const response = await service.getFareQuoteRemote(MockedFareQuoteDto);
    expect(response).toEqual({
      '0': 'C',
      '1': 'o',
      '2': 'r',
      '3': 'r',
      '4': 'e',
      '5': 'c',
      '6': 't',
    });
    expect(MockedFareQuoteRemoteRepository.getFareQuoteRemote).toBeCalledTimes(1);
  });
});
