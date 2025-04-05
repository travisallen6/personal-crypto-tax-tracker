import { Test, TestingModule } from '@nestjs/testing';
import { CostBasisController } from './cost-basis.controller';
import { CostBasis, CostBasisMethod } from './entities/cost-basis.entity';
import { CreateCostBasisDto } from './dto/create-cost-basis.dto';
import { UpdateCostBasisDto } from './dto/update-cost-basis.dto';
import { CostBasisService } from './cost-basis.service';

// Mock service
const mockCostBasisService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('CostBasisController', () => {
  let controller: CostBasisController;
  let service: CostBasisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CostBasisController],
      providers: [
        {
          provide: CostBasisService,
          useValue: mockCostBasisService,
        },
      ],
    }).compile();

    controller = module.get<CostBasisController>(CostBasisController);
    service = module.get<CostBasisService>(CostBasisService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of cost basis records', async () => {
      const result: Partial<CostBasis>[] = [
        {
          id: 1,
          quantity: 100,
          acquisitionChainEventId: null,
          acquisitionExchangeEventId: null,
          disposalChainEventId: null,
          disposalExchangeEventId: null,
          method: CostBasisMethod.FIFO,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(result as CostBasis[]);

      expect(await controller.findAll()).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should return a single cost basis record', async () => {
      const result: Partial<CostBasis> = {
        id: 1,
        quantity: 100,
        acquisitionChainEventId: null,
        acquisitionExchangeEventId: null,
        disposalChainEventId: null,
        disposalExchangeEventId: null,
        method: CostBasisMethod.FIFO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(result as CostBasis);

      expect(await controller.findOne('1')).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a cost basis record', async () => {
      const createDto: CreateCostBasisDto = {
        quantity: 100,
        method: CostBasisMethod.FIFO,
        acquisitionChainEventId: 1,
        disposalChainEventId: 2,
        acquisitionExchangeEventId: 3,
        disposalExchangeEventId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result: Partial<CostBasis> = {
        id: 1,
        ...createDto,
        acquisitionExchangeEventId: null,
        disposalExchangeEventId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'create').mockResolvedValue(result as CostBasis);

      expect(await controller.create(createDto)).toBe(result);
    });
  });

  describe('update', () => {
    it('should update a cost basis record', async () => {
      const updateDto: UpdateCostBasisDto = {
        quantity: 150,
      };

      const result: Partial<CostBasis> = {
        id: 1,
        ...updateDto,
        acquisitionChainEventId: null,
        acquisitionExchangeEventId: null,
        disposalChainEventId: null,
        disposalExchangeEventId: null,
        method: CostBasisMethod.FIFO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'update').mockResolvedValue(result as CostBasis);

      expect(await controller.update('1', updateDto)).toBe(result);
    });
  });

  describe('remove', () => {
    it('should remove a cost basis record', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        quantity: 100,
        method: CostBasisMethod.FIFO,
        acquisitionChainEventId: 1,
        disposalChainEventId: 2,
        acquisitionExchangeEventId: null,
        disposalExchangeEventId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(await controller.remove('1')).toEqual({ success: true });
    });
  });
});
