import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/auth/auth.service';
import { MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { MockedPrismicRemoteRepository } from 'src/prismic/mocks/prismic.mocks';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { PrismicService } from 'src/prismic/services';
import { FlightsController } from '../flights.controller';
import { FlightsRemoteRepository } from '../flights.remote-repository';
import { FlightsService } from '../flights.service';

describe('FlightsController', () => {
  let controller: FlightsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlightsController],
      providers: [
        FlightsService,
        FlightsRemoteRepository,
        PrismicService,
        { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository },
        { provide: AuthService, useValue: MockedAuthService },
      ],
    }).compile();

    controller = module.get<FlightsController>(FlightsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
