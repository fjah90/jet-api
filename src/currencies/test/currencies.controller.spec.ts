import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository, MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { CurrenciesController } from '../currencies.controller';
import { CurrenciesRemoteRepository } from '../currencies.remote-repository';
import { CurrenciesService } from '../currencies.service';

describe('CurrenciesController', () => {
  let controller: CurrenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrenciesController],
      providers: [
        CurrenciesService,
        CurrenciesRemoteRepository,
        { provide: AuthService, useValue: MockedAuthService },
        ConfigService,
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
      ],
    }).compile();

    controller = module.get<CurrenciesController>(CurrenciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
