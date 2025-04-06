import { Test, TestingModule } from '@nestjs/testing';
import { AcquisitionEventService } from './acquisition-event.service';
import { ChainEventService } from '../chain-event/chain-event.service';
import { ExchangeEventService } from '../exchange-event/exchange-event.service';
import { AcquisitionEvent } from './acquisition-event';

describe('AcquisitionEventService', () => {
  let service: AcquisitionEventService;

  const mockChainEventService = {
    getLinkedAcquisitionChainEvents: jest.fn(),
    getUnlinkedAcquisitionChainEvents: jest.fn(),
  };

  const mockExchangeEventService = {
    getLinkedAcquisitionExchangeEvents: jest.fn(),
    getUnlinkedAcquisitionExchangeEvents: jest.fn(),
  };

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        AcquisitionEventService,
        { provide: ChainEventService, useValue: mockChainEventService },
        { provide: ExchangeEventService, useValue: mockExchangeEventService },
      ],
    }).compile();

    service = testModule.get<AcquisitionEventService>(AcquisitionEventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return linked acquisition events', async () => {
    const mockLinkedExchangeEvents = [{ id: 1 }, { id: 2 }];
    const mockLinkedChainEvents = [{ id: 3 }];

    mockExchangeEventService.getLinkedAcquisitionExchangeEvents.mockResolvedValue(
      mockLinkedExchangeEvents,
    );
    mockChainEventService.getLinkedAcquisitionChainEvents.mockResolvedValue(
      mockLinkedChainEvents,
    );

    const result = await service.getLinkedAcquisitionEvents([]);

    expect(result).toHaveLength(3);
    expect(result.every((e) => e instanceof AcquisitionEvent)).toBe(true);
  });

  it('should return unlinked acquisition events', async () => {
    const mockUnlinkedExchangeEvents = [{ id: 4 }];
    const mockUnlinkedChainEvents = [{ id: 5 }, { id: 6 }];

    mockExchangeEventService.getUnlinkedAcquisitionExchangeEvents.mockResolvedValue(
      mockUnlinkedExchangeEvents,
    );
    mockChainEventService.getUnlinkedAcquisitionChainEvents.mockResolvedValue(
      mockUnlinkedChainEvents,
    );

    const result = await service.getUnlinkedAcquisitionEvents([]);

    expect(result).toHaveLength(3);
    expect(result.every((e) => e instanceof AcquisitionEvent)).toBe(true);
  });
});
