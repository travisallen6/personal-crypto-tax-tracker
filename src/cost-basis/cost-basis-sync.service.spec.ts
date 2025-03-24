import { Test, TestingModule } from '@nestjs/testing';
import { CostBasisSyncService } from './cost-basis-sync.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CostBasis } from './entities/cost-basis.entity';
import { CostBasisService } from './cost-basis.service';
import { ExchangeEventService } from '../exchange-event/exchange-event.service';
import { DataSource } from 'typeorm';

describe('CostBasisSyncService', () => {
  let service: CostBasisSyncService;
  let costBasisService: CostBasisService;
  let exchangeEventService: ExchangeEventService;
  let dataSource: DataSource;

  const mockCostBasisRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCostBasisService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockExchangeEventService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findLatestExchangeEventTimestamp: jest.fn(),
  };

  // Define an empty array for mock result
  const emptyExchangeEvents = [];

  // Create a simplified mock data source
  const mockDataSource = {
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(emptyExchangeEvents),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostBasisSyncService,
        {
          provide: getRepositoryToken(CostBasis),
          useValue: mockCostBasisRepository,
        },
        {
          provide: CostBasisService,
          useValue: mockCostBasisService,
        },
        {
          provide: ExchangeEventService,
          useValue: mockExchangeEventService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CostBasisSyncService>(CostBasisSyncService);
    costBasisService = module.get<CostBasisService>(CostBasisService);
    exchangeEventService =
      module.get<ExchangeEventService>(ExchangeEventService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have required services injected', () => {
    expect(costBasisService).toBeDefined();
    expect(exchangeEventService).toBeDefined();
    expect(dataSource).toBeDefined();
  });
});
