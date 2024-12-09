import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository, MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { CurrenciesRemoteRepository } from '../currencies.remote-repository';
import { CurrenciesService } from '../currencies.service';

describe('CurrenciesService', () => {
  let service: CurrenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        CurrenciesRemoteRepository,
        ConfigService,
        { provide: AuthService, useValue: MockedAuthService },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve a correct answer', async () => {
    const currenciesResponse = await service.getAvailableCurrencies();
    expect(currenciesResponse).toEqual(JSON.stringify({ availableCurrencies: ['EUR', 'USD', 'MXN'] }));
  });
});
