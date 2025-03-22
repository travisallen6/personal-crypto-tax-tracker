/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeEventController } from './exchange-event.controller';
import { ExchangeEventService } from './exchange-event.service';
import { ExchangeEventSyncService } from './exchange-event-sync.service';
import { CreateExchangeEventDto } from './dto/create-exchange-event';
import { UpdateExchangeEventDto } from './dto/update-exchange-event';

describe('ExchangeEventController', () => {
  let controller: ExchangeEventController;
  let exchangeEventService: ExchangeEventService;
  let exchangeEventSyncService: ExchangeEventSyncService;

  // Mock data for testing
  const mockExchangeEvent = { id: 1, type: 'buy', timestamp: 1629000000 };
  const mockExchangeEvents = [
    mockExchangeEvent,
    { id: 2, type: 'sell', timestamp: 1629100000 },
  ];

  beforeEach(async () => {
    // Create mock implementations of the services
    const exchangeEventServiceMock = {
      create: jest.fn().mockResolvedValue(mockExchangeEvent),
      createMany: jest.fn().mockResolvedValue(mockExchangeEvents),
      findAll: jest.fn().mockResolvedValue(mockExchangeEvents),
      findOne: jest
        .fn()
        .mockImplementation((id) =>
          Promise.resolve(mockExchangeEvents.find((event) => event.id === id)),
        ),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockExchangeEvent, updatedField: true }),
      remove: jest.fn().mockResolvedValue({ deleted: true }),
    };

    const exchangeEventSyncServiceMock = {
      syncExchangeEvents: jest.fn().mockResolvedValue(undefined),
    };

    const testModule: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeEventController],
      providers: [
        {
          provide: ExchangeEventService,
          useValue: exchangeEventServiceMock,
        },
        {
          provide: ExchangeEventSyncService,
          useValue: exchangeEventSyncServiceMock,
        },
      ],
    }).compile();

    controller = testModule.get<ExchangeEventController>(
      ExchangeEventController,
    );
    exchangeEventService =
      testModule.get<ExchangeEventService>(ExchangeEventService);
    exchangeEventSyncService = testModule.get<ExchangeEventSyncService>(
      ExchangeEventSyncService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new exchange event', async () => {
      const createDto = { type: 'buy' } as CreateExchangeEventDto;
      const result = await controller.create(createDto);
      expect(exchangeEventService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockExchangeEvent);
    });
  });

  describe('createMany', () => {
    it('should create multiple exchange events', async () => {
      const createDtos = [
        { type: 'buy' },
        { type: 'sell' },
      ] as CreateExchangeEventDto[];
      const result = await controller.createMany(createDtos);
      expect(exchangeEventService.createMany).toHaveBeenCalledWith(createDtos);
      expect(result).toEqual(mockExchangeEvents);
    });
  });

  describe('findAll', () => {
    it('should return all exchange events', async () => {
      const result = await controller.findAll();
      expect(exchangeEventService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockExchangeEvents);
    });
  });

  describe('findOne', () => {
    it('should return a specific exchange event by id', async () => {
      const id = 1;
      const result = await controller.findOne(id);
      expect(exchangeEventService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockExchangeEvent);
    });
  });

  describe('update', () => {
    it('should update an exchange event', async () => {
      const id = 1;
      const updateDto = { updatedField: true } as UpdateExchangeEventDto;
      const result = await controller.update(id, updateDto);
      expect(exchangeEventService.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual({ ...mockExchangeEvent, updatedField: true });
    });
  });

  describe('remove', () => {
    it('should remove an exchange event', async () => {
      const id = 1;
      const result = await controller.remove(id);
      expect(exchangeEventService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('syncExchangeEvents', () => {
    it('should sync exchange events and return success message', async () => {
      const result = await controller.syncExchangeEvents();
      expect(exchangeEventSyncService.syncExchangeEvents).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Exchange events sync completed',
      });
    });
  });
});
