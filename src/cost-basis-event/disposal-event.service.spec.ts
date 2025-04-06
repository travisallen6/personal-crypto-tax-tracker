import { Test, TestingModule } from '@nestjs/testing';
import { DisposalEventService } from './disposal-event.service';
import { ChainEventService } from '../chain-event/chain-event.service';
import { ExchangeEventService } from '../exchange-event/exchange-event.service';
import { DisposalEvent } from './disposal-event';

describe('DisposalEventService', () => {
  let service: DisposalEventService;

  const mockChainEventService = {
    getLinkedDisposalChainEvents: jest.fn(),
    getUnlinkedDisposalChainEvents: jest.fn(),
  };

  const mockExchangeEventService = {
    getLinkedDisposalExchangeEvents: jest.fn(),
    getUnlinkedDisposalExchangeEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisposalEventService,
        { provide: ChainEventService, useValue: mockChainEventService },
        { provide: ExchangeEventService, useValue: mockExchangeEventService },
      ],
    }).compile();

    service = module.get<DisposalEventService>(DisposalEventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return linked disposal events', async () => {
    const linkedExchangeEvents = [{ id: 1 }];
    const linkedChainEvents = [{ id: 2 }];

    mockExchangeEventService.getLinkedDisposalExchangeEvents.mockResolvedValue(
      linkedExchangeEvents,
    );
    mockChainEventService.getLinkedDisposalChainEvents.mockResolvedValue(
      linkedChainEvents,
    );

    const result = await service.getLinkedDisposalEvents([]);

    expect(result).toHaveLength(2);
    expect(result.every((e) => e instanceof DisposalEvent)).toBe(true);
  });

  it('should return unlinked disposal events', async () => {
    const unlinkedExchangeEvents = [{ id: 3 }];
    const unlinkedChainEvents = [{ id: 4 }, { id: 5 }];

    mockExchangeEventService.getUnlinkedDisposalExchangeEvents.mockResolvedValue(
      unlinkedExchangeEvents,
    );
    mockChainEventService.getUnlinkedDisposalChainEvents.mockResolvedValue(
      unlinkedChainEvents,
    );

    const result = await service.getUnlinkedDisposalEvents([]);

    expect(result).toHaveLength(3);
    expect(result.every((e) => e instanceof DisposalEvent)).toBe(true);
  });
});
