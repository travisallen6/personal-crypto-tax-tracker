import { Test, TestingModule } from '@nestjs/testing';
import { CostBasisService } from './cost-basis.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CostBasis, CostBasisMethod } from './entities/cost-basis.entity';
import { CreateCostBasisDto } from './dto/create-cost-basis.dto';
import { UpdateCostBasisDto } from './dto/update-cost-basis.dto';
import { CostBasisDB } from './types/cost-basis';

describe('CostBasisService', () => {
  let service: CostBasisService;

  const mockCostBasisRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostBasisService,
        {
          provide: getRepositoryToken(CostBasis),
          useValue: mockCostBasisRepository,
        },
      ],
    }).compile();

    service = module.get<CostBasisService>(CostBasisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new cost basis record', async () => {
      // Arrange
      const createDto: CreateCostBasisDto = {
        acquisitionChainEventId: 1,
        quantity: 1,
        costBasisUSD: 50000,
        method: CostBasisMethod.FIFO,
        acquisitionExchangeEventId: 3,
        disposalExchangeEventId: 4,
        proceedsUSD: 6000,
        remainingQuantity: 50,
        disposalChainEventId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newCostBasis = {
        ...createDto,
        id: 1,
        acquisitionChainEvent: null,
        acquisitionExchangeEvent: null,
        disposalChainEvent: null,
        disposalExchangeEvent: null,
      } as unknown as CostBasis;

      mockCostBasisRepository.create.mockReturnValue(newCostBasis);
      mockCostBasisRepository.save.mockResolvedValue(newCostBasis);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(mockCostBasisRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockCostBasisRepository.save).toHaveBeenCalledWith(newCostBasis);
      expect(result).toEqual(newCostBasis);
    });
  });

  describe('findAll', () => {
    it('should return an array of cost basis records', async () => {
      // Arrange
      const costBasisArray = [
        {
          id: 1,
          acquisitionChainEventId: 1,
          acquisitionChainEvent: null,
          acquisitionExchangeEvent: null,
          acquisitionExchangeEventId: null,
          disposalChainEvent: null,
          disposalChainEventId: null,
          disposalExchangeEvent: null,
          disposalExchangeEventId: null,
          assetSymbol: 'BTC',
          quantity: 1,
          costBasisUSD: 50000,
          proceedsUSD: null,
          method: CostBasisMethod.FIFO,
          remainingQuantity: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          acquisitionChainEventId: null,
          acquisitionChainEvent: null,
          acquisitionExchangeEvent: null,
          acquisitionExchangeEventId: 1,
          disposalChainEvent: null,
          disposalChainEventId: null,
          disposalExchangeEvent: null,
          disposalExchangeEventId: null,
          assetSymbol: 'ETH',
          quantity: 10,
          costBasisUSD: 30000,
          proceedsUSD: null,
          method: CostBasisMethod.FIFO,
          remainingQuantity: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as unknown as CostBasis[];

      mockCostBasisRepository.find.mockResolvedValue(costBasisArray);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockCostBasisRepository.find).toHaveBeenCalledWith({
        relations: [
          'acquisitionChainEvent',
          'acquisitionExchangeEvent',
          'disposalChainEvent',
          'disposalExchangeEvent',
        ],
      });
      expect(result).toEqual(costBasisArray);
    });
  });

  describe('findOne', () => {
    it('should find a cost basis record by id', async () => {
      // Arrange
      const id = 1;
      const costBasis = {
        id,
        acquisitionChainEventId: 1,
        acquisitionChainEvent: null,
        acquisitionExchangeEvent: null,
        acquisitionExchangeEventId: null,
        disposalChainEvent: null,
        disposalChainEventId: null,
        disposalExchangeEvent: null,
        disposalExchangeEventId: null,
        assetSymbol: 'BTC',
        quantity: 1,
        costBasisUSD: 50000,
        proceedsUSD: null,
        method: CostBasisMethod.FIFO,
        remainingQuantity: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CostBasis;

      mockCostBasisRepository.findOne.mockResolvedValue(costBasis);

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(mockCostBasisRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: [
          'acquisitionChainEvent',
          'acquisitionExchangeEvent',
          'disposalChainEvent',
          'disposalExchangeEvent',
        ],
      });
      expect(result).toEqual(costBasis);
    });

    it('should return null if cost basis record is not found', async () => {
      // Arrange
      const id = 999;
      mockCostBasisRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(mockCostBasisRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: [
          'acquisitionChainEvent',
          'acquisitionExchangeEvent',
          'disposalChainEvent',
          'disposalExchangeEvent',
        ],
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a cost basis record and return the updated entity', async () => {
      // Arrange
      const id = 1;
      const updateDto: UpdateCostBasisDto = {
        disposalChainEventId: 2,
        proceedsUSD: 55000,
      };

      const updatedCostBasis: CostBasisDB = {
        id,
        acquisitionChainEventId: 1,
        disposalChainEventId: 2,
        disposalExchangeEventId: 4,
        quantity: 1,
        costBasisUSD: 50000,
        proceedsUSD: 55000,
        method: CostBasisMethod.FIFO,
        remainingQuantity: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        acquisitionExchangeEventId: 3,
      };

      mockCostBasisRepository.update.mockResolvedValue({ affected: 1 });
      mockCostBasisRepository.findOne.mockResolvedValue(updatedCostBasis);

      // Act
      const result = await service.update(id, updateDto);

      // Assert
      expect(mockCostBasisRepository.update).toHaveBeenCalledWith(
        id,
        updateDto,
      );
      expect(mockCostBasisRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual(updatedCostBasis);
    });

    it('should return null if the record to update is not found', async () => {
      // Arrange
      const id = 999;
      const updateDto: UpdateCostBasisDto = {
        proceedsUSD: 55000,
      };

      mockCostBasisRepository.update.mockResolvedValue({ affected: 0 });
      mockCostBasisRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.update(id, updateDto);

      // Assert
      expect(mockCostBasisRepository.update).toHaveBeenCalledWith(
        id,
        updateDto,
      );
      expect(mockCostBasisRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a cost basis record', async () => {
      // Arrange
      const id = 1;
      mockCostBasisRepository.delete.mockResolvedValue({ affected: 1 });

      // Act
      await service.remove(id);

      // Assert
      expect(mockCostBasisRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should not throw an error if the record to remove is not found', async () => {
      // Arrange
      const id = 999;
      mockCostBasisRepository.delete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(service.remove(id)).resolves.not.toThrow();
      expect(mockCostBasisRepository.delete).toHaveBeenCalledWith(id);
    });
  });
});
