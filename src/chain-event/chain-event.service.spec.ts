import { Test, TestingModule } from '@nestjs/testing';
import { ChainEventService } from './chain-event.service';

describe('ChainEventService', () => {
  let service: ChainEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChainEventService],
    }).compile();

    service = module.get<ChainEventService>(ChainEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
