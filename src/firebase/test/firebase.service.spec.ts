import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseService } from '../firebase.service';
import { FirebaseMockedService } from '../mocks/firebase.mocks';

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: FirebaseService, useValue: FirebaseMockedService }, ConfigService],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
