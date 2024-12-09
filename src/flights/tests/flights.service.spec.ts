import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/auth/auth.service';
import { MockedAuthService } from 'src/auth/mocks/auth.mocks';
import { MockedPrismicRemoteRepository, MockedPrismicService } from 'src/prismic/mocks/prismic.mocks';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { PrismicService } from 'src/prismic/services';
import { FlightsRemoteRepository } from '../flights.remote-repository';
import { FlightsService } from '../flights.service';

describe('FlightsService', () => {
  let service: FlightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightsService,
        FlightsRemoteRepository,
        { provide: PrismicService, useValue: MockedPrismicService },
        { provide: PrismicRemoteRepository, useValue: MockedPrismicRemoteRepository },
        { provide: AuthService, useValue: MockedAuthService },
      ],
    }).compile();

    service = module.get<FlightsService>(FlightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve a correct answer', async () => {
    const response = await service.retrieveAllFlights({});
    console.log(response);
  });
});
