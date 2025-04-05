import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateChainEventDto } from './dto/create-chain-event.dto';
import { UpdateChainEventDto } from './dto/update-chain-event.dto';
import { ChainEvent } from './entities/chain-event.entity';
import { ChainEventSchema } from './dto/chain-event.schema';
import {
  ChainEventDB,
  ChainEventIdWithCryptoPriceId,
} from './types/chain-event';
import { ConfigService } from '@nestjs/config';
import { ChainEventConfig } from '../config/config';
import Decimal from 'decimal.js';

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

  private parseChainEvents(createChainEventDtos: CreateChainEventDto[]) {
    return createChainEventDtos.map((createChainEventDto) =>
      ChainEventSchema.parse(createChainEventDto),
    );
  }

  async create(createChainEventDto: CreateChainEventDto) {
    return this.createMany([createChainEventDto]);
  }

  createMany(createChainEventDtos: CreateChainEventDto[]) {
    const parsedChainEventDtos = this.parseChainEvents(createChainEventDtos);

    return this.chainEventRepository.manager
      .createQueryBuilder()
      .insert()
      .into(ChainEvent)
      .values(parsedChainEventDtos)
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

  findByTransactionHash(transactionHash: string) {
    return this.chainEventRepository.findOne({
      where: { transactionHash },
    });
  }

  async findLatestChainEventBlockNumber(): Promise<number> {
    const chainEvent = await this.chainEventRepository.findOne({
      where: {},
      order: { blockNumber: 'DESC' },
    });

    return chainEvent?.blockNumber || this.earliestBlockNumber;
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
      where: {
        cryptoPrice: IsNull(),
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

  private async getDisposalChainEventsWithCostBasis(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ChainEventDB[]> {
    const chainEvents = await this.chainEventRepository.find({
      where: {
        from: In(userAddresses),
      },
      relations: [
        'disposalCostBasis',
        'disposalCostBasis.acquisitionChainEvent',
        'disposalCostBasis.acquisitionExchangeEvent',
      ],
      order: {
        timeStamp: sortOrder,
      },
    });

    return chainEvents;
  }

  private async getAcquisitionChainEventsWithCostBasis(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ChainEventDB[]> {
    const chainEvents = await this.chainEventRepository.find({
      where: {
        to: In(userAddresses),
      },
      relations: [
        'acquisitionCostBasis',
        'acquisitionCostBasis.disposalExchangeEvent',
        'acquisitionCostBasis.disposalChainEvent',
      ],
      order: {
        timeStamp: sortOrder,
      },
    });

    return chainEvents;
  }

  public async getLinkedDisposalChainEvents(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ChainEventDB[]> {
    const disposalChainEvents = await this.getDisposalChainEventsWithCostBasis(
      userAddresses,
      sortOrder,
    );

    return disposalChainEvents.filter(
      (event) => (event.disposalCostBasis?.length ?? 0) > 0,
    );
  }

  public async getUnlinkedDisposalChainEvents(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ChainEventDB[]> {
    const disposalChainEvents = await this.getDisposalChainEventsWithCostBasis(
      userAddresses,
      sortOrder,
    );

    return disposalChainEvents.filter(
      (event) => (event.disposalCostBasis?.length ?? 0) === 0,
    );
  }

  public async getLinkedAcquisitionChainEvents(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ChainEventDB[]> {
    const acquisitionChainEvents =
      await this.getAcquisitionChainEventsWithCostBasis(
        userAddresses,
        sortOrder,
      );

    return acquisitionChainEvents.filter(
      (event) => (event.acquisitionCostBasis?.length ?? 0) > 0,
    );
  }

  public async getUnlinkedAcquisitionChainEvents(
    userAddresses: string[],
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ChainEventDB[]> {
    const acquisitionChainEvents =
      await this.getAcquisitionChainEventsWithCostBasis(
        userAddresses,
        sortOrder,
      );

    return acquisitionChainEvents.filter(
      (event) => (event.acquisitionCostBasis?.length ?? 0) === 0,
    );
  }

  public async adjustChainEventValue(
    chainEventId: number,
    adjustmentValue: Decimal,
  ) {
    await this.chainEventRepository.update(
      { id: chainEventId },
      {
        valueAdjustment: adjustmentValue.toString(),
      },
    );

    return this.chainEventRepository.findOne({
      where: { id: chainEventId },
    });
  }
}
