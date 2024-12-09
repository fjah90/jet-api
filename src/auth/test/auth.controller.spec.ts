import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';
import { AuthController } from '../auth.controller';
import { AuthRemoteRepository } from '../auth.remote-repository';
import { AuthService } from '../auth.service';
import { AuthMockedRepository, MockedAuthService } from '../mocks/auth.mocks';

describe('CurrenciesController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthService, useValue: MockedAuthService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
      ],
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
