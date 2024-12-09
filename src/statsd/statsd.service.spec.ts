import { Test, TestingModule } from '@nestjs/testing';
import { StatsdService } from './statsd.service';

describe('StatsdService', () => {
  let service: StatsdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatsdService],
    }).compile();

    service = module.get<StatsdService>(StatsdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
