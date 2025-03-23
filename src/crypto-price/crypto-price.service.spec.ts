import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CryptoPrice } from './entities/crypto-price.entity';
import { CreateCryptoPriceDTO } from './dto/create-crypto-price.dto';
import { UpdateCryptoPriceDTO } from './dto/update-crypto-price.dto';
import { getHourTimeRange } from '../utils/date';
import { CryptoPriceService } from './crypto-price.service';

describe('CryptoPriceService', () => {
  let service: CryptoPriceService;

  const mockCryptoPriceRepository = {
    manager: {
      createQueryBuilder: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ raw: [] }),
    },
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((entity: CreateCryptoPriceDTO) =>
        Promise.resolve(entity as CryptoPrice),
      ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoPriceService,
        {
          provide: getRepositoryToken(CryptoPrice),
          useValue: mockCryptoPriceRepository,
        },
      ],
    }).compile();

    service = module.get<CryptoPriceService>(CryptoPriceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a single crypto price record', async () => {
      const timestamp = new Date();
      const [rangeStartTimestamp, rangeEndTimestamp] =
        getHourTimeRange(timestamp);
      const cryptoPriceDto: CreateCryptoPriceDTO = {
        timestamp,
        price: 40000,
        symbol: 'BTC',
        rangeStartTimestamp,
        rangeEndTimestamp,
      };

      mockCryptoPriceRepository.save.mockResolvedValueOnce({
        ...cryptoPriceDto,
        id: 1,
      });

      const result = await service.create(cryptoPriceDto);
      expect(result).toEqual({
        ...cryptoPriceDto,
        id: 1,
      });
      expect(mockCryptoPriceRepository.save).toHaveBeenCalledWith(
        cryptoPriceDto,
      );
    });
  });

  describe('createMany', () => {
    it('should create multiple crypto price records', async () => {
      const timestamp1 = new Date();
      const timestamp2 = new Date();
      const cryptoPriceDtos: CreateCryptoPriceDTO[] = [
        {
          timestamp: timestamp1,
          price: 40000,
          symbol: 'BTC',
        },
        {
          timestamp: timestamp2,
          price: 2000,
          symbol: 'ETH',
        },
      ].map((cryptoPriceDto) => {
        const [rangeStartTimestamp, rangeEndTimestamp] = getHourTimeRange(
          cryptoPriceDto.timestamp,
        );

        return {
          ...cryptoPriceDto,
          rangeStartTimestamp: rangeStartTimestamp,
          rangeEndTimestamp: rangeEndTimestamp,
        };
      });

      await service.createMany(cryptoPriceDtos);
      expect(
        mockCryptoPriceRepository.manager.createQueryBuilder,
      ).toHaveBeenCalled();
      expect(mockCryptoPriceRepository.manager.insert).toHaveBeenCalled();
      expect(mockCryptoPriceRepository.manager.into).toHaveBeenCalledWith(
        CryptoPrice,
      );
      expect(mockCryptoPriceRepository.manager.values).toHaveBeenCalledWith(
        cryptoPriceDtos,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of crypto prices', async () => {
      const result = [
        { id: 1, timestamp: new Date(), price: 40000, symbol: 'BTC' },
        { id: 2, timestamp: new Date(), price: 2000, symbol: 'ETH' },
      ];
      mockCryptoPriceRepository.find.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(mockCryptoPriceRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a crypto price by id', async () => {
      const result = {
        id: 1,
        timestamp: new Date(),
        price: 40000,
        symbol: 'BTC',
      };
      mockCryptoPriceRepository.findOne.mockResolvedValue(result);

      expect(await service.findOne(1)).toBe(result);
      expect(mockCryptoPriceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('update', () => {
    it('should update a crypto price', async () => {
      const updateDto: UpdateCryptoPriceDTO = { price: 45000 };
      mockCryptoPriceRepository.update.mockResolvedValue({ affected: 1 });

      expect(await service.update(1, updateDto)).toEqual({ affected: 1 });
      expect(mockCryptoPriceRepository.update).toHaveBeenCalledWith(
        1,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a crypto price', async () => {
      mockCryptoPriceRepository.delete.mockResolvedValue({ affected: 1 });

      expect(await service.remove(1)).toEqual({ affected: 1 });
      expect(mockCryptoPriceRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findPriceBySymbolAndTimestamp', () => {
    it('should find price for a symbol at a specific timestamp', async () => {
      const startTime = new Date('2023-01-01');
      const result = {
        id: 1,
        timestamp: new Date('2023-01-01T12:00:00'),
        price: 40000,
        symbol: 'BTC',
        rangeStartTimestamp: new Date('2023-01-01T12:00:00'),
        rangeEndTimestamp: new Date('2023-01-01T13:00:00'),
      };
      mockCryptoPriceRepository.findOne.mockResolvedValue(result);

      expect(
        await service.findPriceBySymbolAndTimestamp('BTC', startTime),
      ).toBe(result);
      expect(mockCryptoPriceRepository.findOne).toHaveBeenCalled();
    });
  });
});
