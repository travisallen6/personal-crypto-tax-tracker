import { Test, TestingModule } from '@nestjs/testing';
import { ChainEventController } from './chain-event.controller';
import { ChainEventService } from './chain-event.service';

describe('ChainEventController', () => {
  let controller: ChainEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChainEventController],
      providers: [ChainEventService],
    }).compile();

    controller = module.get<ChainEventController>(ChainEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
