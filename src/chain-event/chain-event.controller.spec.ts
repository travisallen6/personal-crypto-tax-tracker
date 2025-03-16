import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ChainEventController } from './chain-event.controller';
import { ChainEventService } from './chain-event.service';
import { ChainEventSyncService } from './chain-event-sync.service';
import { EtherscanService } from './etherscan.service';
import { ChainEvent } from './entities/chain-event.entity';

// Create mock repository
type MockRepository = Partial<Record<keyof Repository<any>, jest.Mock>>;
const createMockRepository = (): MockRepository => ({
  save: jest.fn(),
  insert: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

// Create mock services
const mockChainEventSyncService = {
  syncChainEvents: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('ChainEventController', () => {
  let controller: ChainEventController;
  let service: ChainEventService;
  let syncService: ChainEventSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChainEventController],
      providers: [
        ChainEventService,
        {
          provide: getRepositoryToken(ChainEvent),
          useFactory: createMockRepository,
        },
        {
          provide: ChainEventSyncService,
          useValue: mockChainEventSyncService,
        },
        {
          provide: EtherscanService,
          useFactory: () => ({
            getErc20Transfers: jest.fn(),
          }),
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ChainEventController>(ChainEventController);
    service = module.get<ChainEventService>(ChainEventService);
    syncService = module.get<ChainEventSyncService>(ChainEventSyncService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Add more tests for controller methods
  describe('findAll', () => {
    it('should return an array of chain events', async () => {
      const result = ['test'];
      jest
        .spyOn(service, 'findAll')
        .mockImplementation(() => Promise.resolve(result as any));

      expect(await controller.findAll()).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should return a single chain event', async () => {
      const result = { id: 1 };
      jest
        .spyOn(service, 'findOne')
        .mockImplementation(() => Promise.resolve(result as any));

      expect(await controller.findOne('1')).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a chain event', async () => {
      const createDto = {};
      const result = { id: 1 };
      jest
        .spyOn(service, 'create')
        .mockImplementation(() => Promise.resolve(result as any));

      expect(await controller.create(createDto)).toBe(result);
    });
  });

  describe('update', () => {
    it('should update a chain event', async () => {
      const updateDto = {};
      const result = { affected: 1 };
      jest
        .spyOn(service, 'update')
        .mockImplementation(() => Promise.resolve(result as any));

      expect(await controller.update('1', updateDto)).toBe(result);
    });
  });

  describe('remove', () => {
    it('should remove a chain event', async () => {
      const result = { affected: 1 };
      jest
        .spyOn(service, 'remove')
        .mockImplementation(() => Promise.resolve(result as any));

      expect(await controller.remove('1')).toBe(result);
    });
  });

  describe('syncChainEvents', () => {
    it('should sync chain events for an address', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const result = { synced: true };
      const syncChainEventsSpy = jest
        .spyOn(syncService, 'syncChainEvents')
        .mockImplementation(() => Promise.resolve(result as any));

      expect(await controller.syncChainEvents(address)).toBe(result);
      expect(syncChainEventsSpy).toHaveBeenCalledWith(address);
    });
  });
});
