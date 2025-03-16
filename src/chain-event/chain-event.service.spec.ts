import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChainEventService } from './chain-event.service';
import { ChainEvent } from './entities/chain-event.entity';
import { CreateChainEventDto } from './dto/create-chain-event.dto';
import { UpdateChainEventDto } from './dto/update-chain-event.dto';

type MockRepository = Partial<Record<keyof Repository<any>, jest.Mock>>;
const createMockRepository = (): MockRepository => ({
  save: jest.fn(),
  insert: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('ChainEventService', () => {
  let service: ChainEventService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChainEventService,
        {
          provide: getRepositoryToken(ChainEvent),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ChainEventService>(ChainEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a chain event', async () => {
      const createDto: CreateChainEventDto = {
        blockNumber: 12345678,
        timeStamp: new Date(),
        hash: '0x1234567890abcdef',
        nonce: 123,
        blockHash: '0xabcdef1234567890',
        from: '0x1234567890abcdef1234567890abcdef12345678',
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0x1234567890abcdef1234567890abcdef12345678',
        value: '1000000000000000000',
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        tokenDecimal: 18,
        transactionIndex: 1,
        gas: 21000,
        gasPrice: '5000000000',
        gasUsed: '21000',
        cumulativeGasUsed: '21000',
        confirmations: 10,
      };
      const expectedResult = { id: 1, ...createDto };

      repository.save!.mockReturnValue(expectedResult);

      const result = await service.create(createDto);

      expect(repository.save).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createMany', () => {
    it('should create multiple chain events', async () => {
      const createDtos: CreateChainEventDto[] = [
        {
          blockNumber: 12345678,
          timeStamp: new Date(),
          hash: '0x1234567890abcdef1',
          nonce: 123,
          blockHash: '0xabcdef1234567890',
          from: '0x1234567890abcdef1234567890abcdef12345678',
          contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0x1234567890abcdef1234567890abcdef12345678',
          value: '1000000000000000000',
          tokenName: 'Test Token',
          tokenSymbol: 'TEST',
          tokenDecimal: 18,
          transactionIndex: 1,
          gas: 21000,
          gasPrice: '5000000000',
          gasUsed: '21000',
          cumulativeGasUsed: '21000',
          confirmations: 10,
        },
        {
          blockNumber: 12345679,
          timeStamp: new Date(),
          hash: '0x1234567890abcdef2',
          nonce: 124,
          blockHash: '0xabcdef1234567891',
          from: '0x1234567890abcdef1234567890abcdef12345678',
          contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0x1234567890abcdef1234567890abcdef12345678',
          value: '2000000000000000000',
          tokenName: 'Test Token',
          tokenSymbol: 'TEST',
          tokenDecimal: 18,
          transactionIndex: 2,
          gas: 21000,
          gasPrice: '5000000000',
          gasUsed: '21000',
          cumulativeGasUsed: '42000',
          confirmations: 9,
        },
      ];

      const expectedResult = { identifiers: [{ id: 1 }, { id: 2 }] };
      repository.insert!.mockReturnValue(expectedResult);

      const result = await service.createMany(createDtos);

      expect(repository.insert).toHaveBeenCalledWith(createDtos);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of chain events', async () => {
      const expectedResult = [
        {
          id: 1,
          blockNumber: 12345678,
          timeStamp: new Date(),
          hash: '0x1234567890abcdef',
        },
        {
          id: 2,
          blockNumber: 12345679,
          timeStamp: new Date(),
          hash: '0x1234567890abcdef2',
        },
      ];

      repository.find!.mockReturnValue(expectedResult);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a chain event by id', async () => {
      const id = 1;
      const expectedResult = {
        id,
        blockNumber: 12345678,
        timeStamp: new Date(),
        hash: '0x1234567890abcdef',
      };

      repository.findOne!.mockReturnValue(expectedResult);

      const result = await service.findOne(id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a chain event', async () => {
      const id = 1;
      const updateDto: UpdateChainEventDto = {
        blockNumber: 12345680,
      };
      const expectedResult = { affected: 1 };

      repository.update!.mockReturnValue(expectedResult);

      const result = await service.update(id, updateDto);

      expect(repository.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a chain event', async () => {
      const id = 1;
      const expectedResult = { affected: 1 };

      repository.delete!.mockReturnValue(expectedResult);

      const result = await service.remove(id);

      expect(repository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findLatestChainEventBlockNumber', () => {
    it('should return the latest block number', async () => {
      const chainEvent = {
        id: 1,
        blockNumber: 12345678,
      };

      repository.findOne!.mockReturnValue(chainEvent);

      const result = await service.findLatestChainEventBlockNumber();

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {},
        order: { blockNumber: 'DESC' },
      });
      expect(result).toBe(12345678);
    });

    it('should return 0 if no chain events exist', async () => {
      repository.findOne!.mockReturnValue(null);

      const result = await service.findLatestChainEventBlockNumber();

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {},
        order: { blockNumber: 'DESC' },
      });
      expect(result).toBe(0);
    });
  });
});
