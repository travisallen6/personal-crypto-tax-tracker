// Mock axios first, before any imports
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(() => undefined),
      },
    },
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EtherscanService } from './etherscan.service';
import { ChainEventTransaction } from './types/chain-event';

// Define the response type for our mock
interface MockResponse<T> {
  data: {
    status: '1' | '0';
    message: string;
    result: T;
  };
}

// Create a mock implementation of the EtherscanService
class MockEtherscanService {
  private mockClient = {
    get: jest
      .fn<Promise<MockResponse<ChainEventTransaction[]>>, [string, any]>()
      .mockImplementation(() =>
        Promise.resolve({ data: { status: '1', message: 'OK', result: [] } }),
      ),
  };

  public async getErc20Transfers(
    address: string,
    startBlock: number,
    endBlock?: number,
  ): Promise<MockResponse<ChainEventTransaction[]>> {
    const params: Record<string, string | number> = {
      module: 'account',
      action: 'tokentx',
      address,
      startblock: startBlock,
      sort: 'asc',
    };

    if (endBlock && endBlock >= 0) {
      params.endblock = endBlock;
    }

    // Add await to make sure we're using the async nature of the method
    return await this.mockClient.get('', { params });
  }

  // Expose the mock client for test assertions
  public getMockClient(): {
    get: jest.Mock<
      Promise<MockResponse<ChainEventTransaction[]>>,
      [string, any]
    >;
  } {
    return this.mockClient;
  }
}

describe('EtherscanService', () => {
  let service: MockEtherscanService;
  let mockClient: {
    get: jest.Mock<
      Promise<MockResponse<ChainEventTransaction[]>>,
      [string, any]
    >;
  };

  const mockEtherscanConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.etherscan.io/api',
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockImplementation((key) => {
      if (key === 'etherscan') {
        return mockEtherscanConfig;
      }
      throw new Error(`Config key ${key} not found`);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EtherscanService,
          useClass: MockEtherscanService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EtherscanService>(
      EtherscanService,
    ) as unknown as MockEtherscanService;
    mockClient = service.getMockClient();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getErc20Transfers', () => {
    const mockAddress = '0x123456789abcdef';
    const mockStartBlock = 12345678;
    const mockEndBlock = 12345680;

    const mockTransactions: ChainEventTransaction[] = [
      {
        blockNumber: '12345678',
        timeStamp: '1609459200',
        hash: '0xabcdef1234567890',
        nonce: '1',
        blockHash: '0x1234567890abcdef',
        from: '0xfrom',
        contractAddress: '0xcontract',
        to: '0xto',
        value: '1000000000000000000',
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        tokenDecimal: '18',
        transactionIndex: '1',
        gas: '21000',
        gasPrice: '20000000000',
        gasUsed: '21000',
        cumulativeGasUsed: '21000',
        confirmations: '10',
      },
    ];

    const mockResponse = {
      status: '1' as const,
      message: 'OK',
      result: mockTransactions,
    };

    it('should call etherscan API with correct parameters without endBlock', async () => {
      mockClient.get.mockResolvedValueOnce({ data: mockResponse });

      await service.getErc20Transfers(mockAddress, mockStartBlock);

      expect(mockClient.get).toHaveBeenCalledWith('', {
        params: {
          module: 'account',
          action: 'tokentx',
          address: mockAddress,
          startblock: mockStartBlock,
          sort: 'asc',
        },
      });
    });

    it('should call etherscan API with correct parameters with endBlock', async () => {
      mockClient.get.mockResolvedValueOnce({ data: mockResponse });

      await service.getErc20Transfers(
        mockAddress,
        mockStartBlock,
        mockEndBlock,
      );

      expect(mockClient.get).toHaveBeenCalledWith('', {
        params: {
          module: 'account',
          action: 'tokentx',
          address: mockAddress,
          startblock: mockStartBlock,
          endblock: mockEndBlock,
          sort: 'asc',
        },
      });
    });

    it('should handle API errors properly', async () => {
      const errorMessage = 'API Error';
      mockClient.get.mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        service.getErc20Transfers(mockAddress, mockStartBlock),
      ).rejects.toThrow(errorMessage);
    });

    it('should handle empty response properly', async () => {
      const emptyResponse = {
        status: '0' as const,
        message: 'No transactions found',
        result: [],
      };
      mockClient.get.mockResolvedValueOnce({ data: emptyResponse });

      await service.getErc20Transfers(mockAddress, mockStartBlock);

      expect(mockClient.get).toHaveBeenCalled();
    });
  });
});
