import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoPrice } from './entities/crypto-price.entity';
import { CryptoPriceSchema } from './dto/crypto-price.schema';
import { UpdateCryptoPriceDTO } from './dto/update-crypto-price.dto';
import { CreateCryptoPriceDTO } from './dto/create-crypto-price.dto';
import { getHourTimeRange } from '../utils/date';

@Injectable()
export class CryptoPriceService {
  private readonly logger = new Logger(CryptoPriceService.name);
  constructor(
    @InjectRepository(CryptoPrice)
    private cryptoPriceRepository: Repository<CryptoPrice>,
  ) {}

  validateCryptoPrices(cryptoPriceDtos: CreateCryptoPriceDTO[]) {
    cryptoPriceDtos.forEach((cryptoPriceDto) => {
      CryptoPriceSchema.parse(cryptoPriceDto);
    });
  }

  private applyTimeRangeToCryptoPrices(
    cryptoPriceDtos: CreateCryptoPriceDTO[],
  ) {
    return cryptoPriceDtos.map((cryptoPriceDto) => {
      const [rangeStartTimestamp, rangeEndTimestamp] = getHourTimeRange(
        cryptoPriceDto.timestamp,
      );
      cryptoPriceDto.rangeStartTimestamp = rangeStartTimestamp;
      cryptoPriceDto.rangeEndTimestamp = rangeEndTimestamp;
      return cryptoPriceDto;
    });
  }

  create(cryptoPriceDto: CreateCryptoPriceDTO) {
    const [cryptoPriceDtoWithTimeRange] = this.applyTimeRangeToCryptoPrices([
      cryptoPriceDto,
    ]);

    this.validateCryptoPrices([cryptoPriceDtoWithTimeRange]);

    return this.cryptoPriceRepository.save(cryptoPriceDtoWithTimeRange);
  }

  createMany(cryptoPriceDtos: CreateCryptoPriceDTO[]) {
    const cryptoPriceDtosWithTimeRange =
      this.applyTimeRangeToCryptoPrices(cryptoPriceDtos);

    this.validateCryptoPrices(cryptoPriceDtosWithTimeRange);

    return this.cryptoPriceRepository.manager
      .createQueryBuilder()
      .insert()
      .into(CryptoPrice)
      .values(cryptoPriceDtosWithTimeRange)
      .orIgnore()
      .execute();
  }

  findAll() {
    return this.cryptoPriceRepository.find();
  }

  findOne(id: number) {
    return this.cryptoPriceRepository.findOne({ where: { id } });
  }

  update(id: number, cryptoPriceDto: UpdateCryptoPriceDTO) {
    return this.cryptoPriceRepository.update(id, cryptoPriceDto);
  }

  remove(id: number) {
    return this.cryptoPriceRepository.delete(id);
  }

  async findPriceBySymbolAndTimestamp(
    symbol: string,
    timestamp: Date,
  ): Promise<CryptoPrice | null> {
    const [rangeStartTimestamp, rangeEndTimestamp] =
      getHourTimeRange(timestamp);
    return this.cryptoPriceRepository.findOne({
      where: {
        symbol,
        rangeStartTimestamp,
        rangeEndTimestamp,
      },
      order: { timestamp: 'ASC' },
    });
  }
}
