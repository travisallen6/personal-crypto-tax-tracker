import { Test, TestingModule } from '@nestjs/testing';
import { CryptoPriceSyncService } from './crypto-price-sync.service';
import { CryptoPriceService } from './crypto-price.service';
import { CoinGeckoService } from './coin-gecko.service';
import { Logger } from '@nestjs/common';
import { CryptoPriceDB } from './types/crypo-price';
import { ChainEventDB } from '../chain-event/types/chain-event';

describe('CryptoPriceSyncService', () => {
  let service: CryptoPriceSyncService;
  let cryptoPriceService: Partial<CryptoPriceService>;
  let coinGeckoService: Partial<CoinGeckoService>;
  let loggerErrorMock: jest.SpyInstance;
  let loggerWarnMock: jest.SpyInstance;

  beforeEach(async () => {
    // Create mock services
    cryptoPriceService = {
      findPriceBySymbolAndTimestamp: jest.fn(),
      create: jest.fn(),
    };

    coinGeckoService = {
      getTokenPriceAtTimestamp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoPriceSyncService,
        {
          provide: CryptoPriceService,
          useValue: cryptoPriceService,
        },
        {
          provide: CoinGeckoService,
          useValue: coinGeckoService,
        },
      ],
    }).compile();

    service = module.get<CryptoPriceSyncService>(CryptoPriceSyncService);

    // Spy on logger to prevent console output during tests
    loggerErrorMock = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    loggerWarnMock = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('populateMissingCryptoPrices', () => {
    it('should return chain event IDs with crypto price IDs when prices are found', async () => {
      const mockTimestamp = new Date('2023-01-01T12:00:00Z');
      const mockChainEvents: ChainEventDB[] = [
        {
          id: 1,
          tokenSymbol: 'BTC',
          timeStamp: mockTimestamp,
        } as ChainEventDB,
        {
          id: 2,
          tokenSymbol: 'ETH',
          timeStamp: mockTimestamp,
        } as ChainEventDB,
      ];

      const mockCryptoPrice1: CryptoPriceDB = {
        id: 101,
        symbol: 'BTC',
        price: 40000,
        timestamp: mockTimestamp,
      } as CryptoPriceDB;

      const mockCryptoPrice2: CryptoPriceDB = {
        id: 102,
        symbol: 'ETH',
        price: 2000,
        timestamp: mockTimestamp,
      } as CryptoPriceDB;

      // First chain event - BTC price exists
      (cryptoPriceService.findPriceBySymbolAndTimestamp as jest.Mock)
        .mockResolvedValueOnce(mockCryptoPrice1)
        // Second chain event - ETH price exists
        .mockResolvedValueOnce(mockCryptoPrice2);

      const result = await service.populateMissingCryptoPrices(mockChainEvents);

      expect(result).toEqual([
        { id: 1, cryptoPriceId: 101 },
        { id: 2, cryptoPriceId: 102 },
      ]);
      expect(
        cryptoPriceService.findPriceBySymbolAndTimestamp,
      ).toHaveBeenCalledTimes(2);
      expect(coinGeckoService.getTokenPriceAtTimestamp).not.toHaveBeenCalled();
    });

    it('should fetch prices from CoinGecko when not found in database', async () => {
      const mockTimestamp = new Date('2023-01-01T12:00:00Z');
      const mockChainEvents: ChainEventDB[] = [
        {
          id: 1,
          tokenSymbol: 'BTC',
          timeStamp: mockTimestamp,
        } as ChainEventDB,
      ];

      // Price not found in database
      (
        cryptoPriceService.findPriceBySymbolAndTimestamp as jest.Mock
      ).mockResolvedValueOnce(null);

      // CoinGecko returns price data
      (
        coinGeckoService.getTokenPriceAtTimestamp as jest.Mock
      ).mockResolvedValueOnce({
        symbol: 'BTC',
        price: 40000,
        timestamp: mockTimestamp,
      });

      // New price created in database
      (cryptoPriceService.create as jest.Mock).mockResolvedValueOnce({
        id: 101,
        symbol: 'BTC',
        price: 40000,
        timestamp: mockTimestamp,
      });

      const result = await service.populateMissingCryptoPrices(mockChainEvents);

      expect(result).toEqual([{ id: 1, cryptoPriceId: 101 }]);
      expect(
        cryptoPriceService.findPriceBySymbolAndTimestamp,
      ).toHaveBeenCalledTimes(1);
      expect(coinGeckoService.getTokenPriceAtTimestamp).toHaveBeenCalledTimes(
        1,
      );
      expect(cryptoPriceService.create).toHaveBeenCalledTimes(1);
    });

    it('should handle case when price cannot be found', async () => {
      const mockTimestamp = new Date('2023-01-01T12:00:00Z');
      const mockChainEvents: ChainEventDB[] = [
        {
          id: 1,
          tokenSymbol: 'UNKNOWN',
          timeStamp: mockTimestamp,
        } as ChainEventDB,
      ];

      // Price not found in database
      (
        cryptoPriceService.findPriceBySymbolAndTimestamp as jest.Mock
      ).mockResolvedValueOnce(null);

      // CoinGecko also cannot find the price
      (
        coinGeckoService.getTokenPriceAtTimestamp as jest.Mock
      ).mockResolvedValueOnce(null);

      const result = await service.populateMissingCryptoPrices(mockChainEvents);

      expect(result).toEqual([]);
      expect(
        cryptoPriceService.findPriceBySymbolAndTimestamp,
      ).toHaveBeenCalledTimes(1);
      expect(coinGeckoService.getTokenPriceAtTimestamp).toHaveBeenCalledTimes(
        1,
      );
      expect(cryptoPriceService.create).not.toHaveBeenCalled();
      expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching prices', async () => {
      const mockTimestamp = new Date('2023-01-01T12:00:00Z');
      const mockChainEvents: ChainEventDB[] = [
        {
          id: 1,
          tokenSymbol: 'BTC',
          timeStamp: mockTimestamp,
        } as ChainEventDB,
      ];

      // Price lookup throws an error
      (
        cryptoPriceService.findPriceBySymbolAndTimestamp as jest.Mock
      ).mockRejectedValueOnce(new Error('Database error'));

      const result = await service.populateMissingCryptoPrices(mockChainEvents);

      expect(result).toEqual([]);
      expect(
        cryptoPriceService.findPriceBySymbolAndTimestamp,
      ).toHaveBeenCalledTimes(1);
      expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    });
  });
});
