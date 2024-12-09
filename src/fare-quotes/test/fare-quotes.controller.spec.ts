import { Test, TestingModule } from '@nestjs/testing';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { AuthMockedRepository, MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { FareQuotesController } from '../fare-quotes.controller';
import { FareQuotesRemoteRepository } from '../fare-quotes.remote-repository';
import { FareQuotesService } from '../fare-quotes.service';
import { MockedFareQuoteRemoteRepository } from '../mocks/fare-quotes.mocks';

describe('FareQuotesController', () => {
  let controller: FareQuotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FareQuotesController],
      providers: [
        FareQuotesService,
        { provide: FareQuotesRemoteRepository, useValue: MockedFareQuoteRemoteRepository },
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthService, useValue: MockedAuthService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
      ],
    }).compile();

    controller = module.get<FareQuotesController>(FareQuotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
