import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeEventSyncService } from './exchange-event-sync.service';
import { ExchangeEventService } from './exchange-event.service';
import { KrakenService } from './kraken.service';
describe('ExchangeEventSyncService', () => {
  let service: ExchangeEventSyncService;
  let exchangeEventService: Partial<ExchangeEventService>;
  let krakenService: Partial<KrakenService>;

  beforeEach(async () => {
    // Create mock services
    exchangeEventService = {
      findLatestExchangeEventTimestamp: jest.fn(),
      createMany: jest.fn(),
    };

    krakenService = {
      getClosedTrades: jest.fn(),
    };

    // Recreate service with mocks
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeEventSyncService,
        {
          provide: ExchangeEventService,
          useValue: exchangeEventService,
        },
        {
          provide: KrakenService,
          useValue: krakenService,
        },
      ],
    }).compile();

    service = testModule.get<ExchangeEventSyncService>(
      ExchangeEventSyncService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncExchangeEvents', () => {
    it('should sync exchange events from the latest timestamp', async () => {
      // Mock the latest timestamp
      (
        exchangeEventService.findLatestExchangeEventTimestamp as jest.Mock
      ).mockResolvedValue(1609459200);

      // Mock the getClosedTrades method to return test data
      const mockEvents = {
        results: [
          {
            txid: 'TXID1',
            time: new Date(1609459200000),
            type: 'sell',
            price: 30000.0,
          },
          {
            txid: 'TXID2',
            time: new Date(1609459300000),
            type: 'buy',
            price: 1000.0,
          },
        ],
        currentOffset: 0,
        totalResultsCount: 2,
      };

      (krakenService.getClosedTrades as jest.Mock).mockResolvedValue(
        mockEvents,
      );

      // Call the method
      await service.syncExchangeEvents();

      // Verify the correct methods were called
      expect(
        exchangeEventService.findLatestExchangeEventTimestamp,
      ).toHaveBeenCalled();
      expect(krakenService.getClosedTrades).toHaveBeenCalledWith(
        1609459200,
        expect.any(Number),
        0,
      );
      expect(exchangeEventService.createMany).toHaveBeenCalledWith(
        mockEvents.results,
      );
    });

    it('should handle pagination when there are more results', async () => {
      // Mock implementation to test pagination
      (
        exchangeEventService.findLatestExchangeEventTimestamp as jest.Mock
      ).mockResolvedValue(1609459200);

      // First page of results
      const firstPageEvents = {
        results: [
          { txid: 'TXID1', time: new Date(1609459200000) },
          { txid: 'TXID2', time: new Date(1609459300000) },
        ],
        currentOffset: 0,
        totalResultsCount: 4, // Total of 4 events, so we need to fetch more
      };

      // Second page of results
      const secondPageEvents = {
        results: [
          { txid: 'TXID3', time: new Date(1609459400000) },
          { txid: 'TXID4', time: new Date(1609459500000) },
        ],
        currentOffset: 2,
        totalResultsCount: 4,
      };

      // Set up the mock to return different values on subsequent calls
      (krakenService.getClosedTrades as jest.Mock)
        .mockResolvedValueOnce(firstPageEvents)
        .mockResolvedValueOnce(secondPageEvents);

      // Call the method
      await service.syncExchangeEvents();

      // Verify the correct methods were called
      expect(krakenService.getClosedTrades).toHaveBeenCalledTimes(2);

      // First call should use offset 0
      expect(krakenService.getClosedTrades).toHaveBeenNthCalledWith(
        1,
        1609459200,
        expect.any(Number),
        0,
      );

      // Second call should use offset 2
      expect(krakenService.getClosedTrades).toHaveBeenNthCalledWith(
        2,
        1609459200,
        expect.any(Number),
        2,
      );

      // Both sets of results should be saved
      expect(exchangeEventService.createMany).toHaveBeenCalledTimes(2);
      expect(exchangeEventService.createMany).toHaveBeenNthCalledWith(
        1,
        firstPageEvents.results,
      );
      expect(exchangeEventService.createMany).toHaveBeenNthCalledWith(
        2,
        secondPageEvents.results,
      );
    });

    it('should use provided start timestamp if specified', async () => {
      // Mock the getClosedTrades method to return test data
      const mockEvents = {
        results: [{ txid: 'TXID1', time: new Date(1609459200000) }],
        currentOffset: 0,
        totalResultsCount: 1,
      };

      (krakenService.getClosedTrades as jest.Mock).mockResolvedValue(
        mockEvents,
      );

      // Call the method with a specific start timestamp
      const specificStartTime = 1609450000;
      await service.syncExchangeEvents(specificStartTime);

      // Verify the correct methods were called with the specific timestamp
      expect(
        exchangeEventService.findLatestExchangeEventTimestamp,
      ).not.toHaveBeenCalled();
      expect(krakenService.getClosedTrades).toHaveBeenCalledWith(
        specificStartTime,
        expect.any(Number),
        0,
      );
    });

    it('should handle empty results', async () => {
      // Mock the latest timestamp
      (
        exchangeEventService.findLatestExchangeEventTimestamp as jest.Mock
      ).mockResolvedValue(1609459200);

      // Mock empty results
      const emptyEvents = {
        results: [],
        currentOffset: 0,
        totalResultsCount: 0,
      };

      (krakenService.getClosedTrades as jest.Mock).mockResolvedValue(
        emptyEvents,
      );

      // Call the method
      await service.syncExchangeEvents();

      // Verify the correct methods were called
      expect(krakenService.getClosedTrades).toHaveBeenCalledTimes(1);
      expect(exchangeEventService.createMany).toHaveBeenCalledWith([]);
    });
  });
});
