import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoinGeckoService } from './coin-gecko.service';
import axios, { AxiosInstance } from 'axios';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('CoinGeckoService', () => {
  let service: CoinGeckoService;
  let mockClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: jest.fn().mockImplementation((key) => {
        if (key === 'coinGecko') {
          return {
            timestampRangeInterval: 86400000, // 24 hours in milliseconds
            coinIdMap: {
              BTC: 'bitcoin',
              ETH: 'ethereum',
            },
          };
        }
        throw new Error(`Configuration key "${key}" does not exist`);
      }),
    };

    // Create mock client before module creation
    mockClient = {
      get: jest.fn(),
    };

    // Mock axios.create to return our mock client
    mockAxios.create.mockReturnValue(mockClient as unknown as AxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        CoinGeckoService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CoinGeckoService>(CoinGeckoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokenPriceAtTimestamp', () => {
    beforeEach(() => {
      // Reset mocks before each test in this describe block
      mockClient.get.mockReset();
    });

    it('should return null when no coinId mapping exists', async () => {
      // Arrange
      const unknownSymbol = 'UNKNOWN';
      const timestamp = new Date();

      // Act
      const result = await service.getTokenPriceAtTimestamp(
        unknownSymbol,
        timestamp,
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return price data when API call is successful', async () => {
      // Arrange
      const symbol = 'ETH';
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const expectedPrice = 1234.56;

      // Explicitly reset the mock to ensure clean state
      mockClient.get.mockReset();

      // Mock response with resolved value
      mockClient.get.mockResolvedValueOnce({
        data: {
          prices: [
            [timestamp.getTime() - 3600000, 1200], // 1 hour before
            [timestamp.getTime(), expectedPrice], // Exact time
            [timestamp.getTime() + 3600000, 1300], // 1 hour after
          ],
          market_caps: [],
          total_volumes: [],
        },
      });

      // Act
      const result = await service.getTokenPriceAtTimestamp(symbol, timestamp);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.symbol).toBe(symbol);
      expect(result?.price).toBe(expectedPrice);
      expect(result?.timestamp).toEqual(new Date(timestamp.getTime()));
      expect(mockClient.get).toHaveBeenCalledWith(
        '/coins/ethereum/market_chart/range',
        expect.any(Object),
      );
    });

    it('should return the closest price point if exact match not found', async () => {
      // Arrange
      const symbol = 'BTC';
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const closestTimestamp = timestamp.getTime() - 1800000; // 30 minutes before
      const expectedPrice = 16789.12;

      // Explicitly reset the mock to ensure clean state
      mockClient.get.mockReset();

      // Use resolved value for consistency
      mockClient.get.mockResolvedValueOnce({
        data: {
          prices: [
            [timestamp.getTime() - 3600000, 16700], // 1 hour before
            [closestTimestamp, expectedPrice], // 30 minutes before (closest)
            [timestamp.getTime() + 3600000, 16900], // 1 hour after
          ],
          market_caps: [],
          total_volumes: [],
        },
      });

      // Act
      const result = await service.getTokenPriceAtTimestamp(symbol, timestamp);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.symbol).toBe(symbol);
      expect(result?.price).toBe(expectedPrice);
      expect(result?.timestamp).toEqual(new Date(closestTimestamp));
      expect(mockClient.get).toHaveBeenCalledWith(
        '/coins/bitcoin/market_chart/range',
        expect.any(Object),
      );
    });

    it('should return null when API call fails', async () => {
      // Arrange
      const symbol = 'ETH';
      const timestamp = new Date();

      // Explicitly reset the mock to ensure clean state
      mockClient.get.mockReset();

      // Mock the axios.get method to throw an error
      mockClient.get.mockRejectedValueOnce(new Error('API error'));

      // Act
      const result = await service.getTokenPriceAtTimestamp(symbol, timestamp);

      // Assert
      expect(result).toBeNull();
      expect(mockClient.get).toHaveBeenCalled();
    });
  });
});
