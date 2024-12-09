import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MockedPrismicRemoteRepository } from '../mocks/prismic.mocks';
import { PrismicRemoteRepository } from '../repositories';
import { PrismicService } from '../services';

describe('PrismicService', () => {
  let prismicService: PrismicService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismicService,
        { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository },
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
    prismicService = module.get<PrismicService>(PrismicService);
  });

  it('should be defined', () => {
    expect(prismicService).toBeDefined();
  });

  it('should retrieve a correct answer', async () => {
    const response = await prismicService.getAirports({});
    expect(response).toEqual(true);
    expect(MockedPrismicRemoteRepository.getAirports).toBeCalledTimes(1);
  });
});
