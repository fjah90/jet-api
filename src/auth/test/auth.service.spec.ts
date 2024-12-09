import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthRemoteRepository } from '../auth.remote-repository';
import { AuthService } from '../auth.service';
import { MOCKED_USER_CREDENTIAL } from '../mocks/auth.mocks';
import { AuthMockedRepository } from '../mocks/auth.mocks';
import { FirebaseMockedService } from 'src/firebase/mocks/firebase.mocks';

jest.mock('firebase/auth', () => {
  return {
    UserCredential: {},
    signInWithEmailAndPassword: jest.fn(async () => MOCKED_USER_CREDENTIAL),
    createUserWithEmailAndPassword: jest.fn(async () => MOCKED_USER_CREDENTIAL),
  };
});

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
        { provide: FirebaseService, useValue: FirebaseMockedService },
        { provide: AuthRemoteRepository, useValue: AuthMockedRepository },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should create a firebase JWT', async () => {
    const response = await authService.signUp({ username: 'test', email: 'test@test.com', password: 'test' });
    expect(response).toEqual('Account created!');
  });

  it('should return a firebase JWT', async () => {
    const response = await authService.signIn({ email: 'test@test.com', password: 'test' });
    expect(response).toEqual(MOCKED_USER_CREDENTIAL);
  });

  it('should create and retrieve a radixx token', async () => {
    await authService.retrieveSecurityToken();
    expect(authService.radixxToken).toBeDefined();
    expect(AuthMockedRepository.retrieveSecurityToken).toHaveBeenCalledTimes(1);
  });

  it('should validate a radixx token', async () => {
    authService.radixxToken = faker.datatype.string();
    await authService.validateSecurityToken();
    expect(authService.isRadixxTokenValid).toBeDefined();
    expect(authService.isRadixxTokenValid).toEqual(true);
    expect(AuthMockedRepository.validateSecurityToken).toHaveBeenCalledTimes(1);
  });
});
