import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateChainEventDto } from './dto/create-chain-event.dto';
import { UpdateChainEventDto } from './dto/update-chain-event.dto';
import { ChainEvent } from './entities/chain-event.entity';
import { ChainEventSchema } from './dto/chain-event.schema';
import { ChainEventIdWithCryptoPriceId } from './types/chain-event';
@Injectable()
export class ChainEventService {
  constructor(
    @InjectRepository(ChainEvent)
    private chainEventRepository: Repository<ChainEvent>,
  ) {}

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

    return chainEvent?.blockNumber || 0;
  }

  async findChainEventsMissingCryptoPrice(): Promise<ChainEvent[]> {
    return this.chainEventRepository.find({
      select: {
        id: true,
        tokenSymbol: true,
        timeStamp: true,
        cryptoPrice: {
          id: true,
        },
      },
      where: { cryptoPrice: IsNull() },
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
