import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateChainEventDto } from './dto/create-chain-event.dto';
import { UpdateChainEventDto } from './dto/update-chain-event.dto';
import { ChainEvent } from './entities/chain-event.entity';
import { ChainEventSchema } from './dto/chain-event.schema';
import { ChainEventIdWithCryptoPriceId } from './types/chain-event';
import { ConfigService } from '@nestjs/config';
import { ChainEventConfig } from '../config/config';
import { addDays, subYears } from 'date-fns';
@Injectable()
export class ChainEventService {
  private earliestBlockNumber: number;

  constructor(
    @InjectRepository(ChainEvent)
    private chainEventRepository: Repository<ChainEvent>,
    private config: ConfigService,
  ) {
    const ChainEventConfig =
      this.config.getOrThrow<ChainEventConfig>('chainEvent');

    this.earliestBlockNumber = ChainEventConfig.earliestBlockNumber;
  }

  validateChainEvents(createChainEventDtos: CreateChainEventDto[]) {
    createChainEventDtos.forEach((createChainEventDto) => {
      ChainEventSchema.parse(createChainEventDto);
    });
  }

  async create(createChainEventDto: CreateChainEventDto) {
    return this.createMany([createChainEventDto]);
  }

  createMany(createChainEventDtos: CreateChainEventDto[]) {
    this.validateChainEvents(createChainEventDtos);

    return this.chainEventRepository.manager
      .createQueryBuilder()
      .insert()
      .into(ChainEvent)
      .values(createChainEventDtos)
      .orIgnore()
      .execute();
  }

  findAll() {
    return this.chainEventRepository.find();
  }

  findOne(id: number) {
    return this.chainEventRepository.findOne({ where: { id } });
  }

  update(id: number, updateChainEventDto: UpdateChainEventDto) {
    return this.chainEventRepository.update(id, updateChainEventDto);
  }

  remove(id: number) {
    return this.chainEventRepository.delete(id);
  }

  async findLatestChainEventBlockNumber(): Promise<number> {
    const chainEvent = await this.chainEventRepository.findOne({
      where: {},
      order: { blockNumber: 'DESC' },
    });

    return chainEvent?.blockNumber || this.earliestBlockNumber;
  }

  async findChainEventsMissingCryptoPrice(): Promise<ChainEvent[]> {
    const oneYearAgo = addDays(subYears(new Date(), 1), 1);
    return this.chainEventRepository.find({
      select: {
        id: true,
        tokenSymbol: true,
        timeStamp: true,
        cryptoPrice: {
          id: true,
        },
      },
      where: {
        cryptoPrice: IsNull(),
        timeStamp: MoreThan(oneYearAgo),
      },
    });
  }

  async updateChainEventsWithCryptoPrice(
    chainEventIdsWithCryptoPriceIds: ChainEventIdWithCryptoPriceId[],
  ) {
    if (chainEventIdsWithCryptoPriceIds.length === 0) {
      return [];
    }

    // Execute a batch update by creating individual updates and running them in a single transaction
    return this.chainEventRepository.manager.transaction(async (manager) => {
      const promises = chainEventIdsWithCryptoPriceIds.map(
        ({ id, cryptoPriceId }) =>
          manager.update(ChainEvent, id, {
            cryptoPrice: { id: cryptoPriceId },
          }),
      );

      return Promise.all(promises);
    });
  }
}
