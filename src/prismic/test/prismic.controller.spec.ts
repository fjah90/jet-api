import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismicController } from '../controllers';
import { MockedPrismicRemoteRepository } from '../mocks/prismic.mocks';
import { PrismicRemoteRepository } from '../repositories';
import { PrismicService } from '../services';

describe('PrismicController', () => {
  let controller: PrismicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [PrismicService, { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository }],
      controllers: [PrismicController],
    }).compile();

    controller = module.get<PrismicController>(PrismicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
