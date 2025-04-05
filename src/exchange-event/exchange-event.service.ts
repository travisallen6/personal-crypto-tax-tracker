import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeEvent } from './entities/exchange-event.entity';
import { CreateExchangeEventDto } from './dto/create-exchange-event';
import { UpdateExchangeEventDto } from './dto/update-exchange-event';
import { ExchangeEventSchema } from './dto/exchange-event.schema';
import { ExchangeEventDB } from './types/exchange-event';

@Injectable()
export class ExchangeEventService {
  constructor(
    @InjectRepository(ExchangeEvent)
    private readonly exchangeEventRepository: Repository<ExchangeEvent>,
  ) {}

  private hydrateExchangeEvents(exchangeEvents: CreateExchangeEventDto[]) {
    return exchangeEvents.map((exchangeEvent) => {
      return {
        ...exchangeEvent,
        time: new Date(exchangeEvent.time),
      };
    });
  }

  private validateExchangeEvents(exchangeEvents: CreateExchangeEventDto[]) {
    exchangeEvents.forEach((exchangeEvent) => {
      ExchangeEventSchema.parse(exchangeEvent);
    });
  }

  public create(exchangeEvent: CreateExchangeEventDto) {
    return this.createMany([exchangeEvent]);
  }

  public createMany(exchangeEvents: CreateExchangeEventDto[]) {
    const hydratedExchangeEvents = this.hydrateExchangeEvents(exchangeEvents);
    this.validateExchangeEvents(hydratedExchangeEvents);
    return this.exchangeEventRepository.manager
      .createQueryBuilder()
      .insert()
      .into(ExchangeEvent)
      .values(hydratedExchangeEvents)
      .orIgnore()
      .execute();
  }

  public findAll() {
    return this.exchangeEventRepository.find();
  }

  public findOne(id: number) {
    return this.exchangeEventRepository.findOne({ where: { id } });
  }

  public update(id: number, partialEntity: UpdateExchangeEventDto) {
    return this.exchangeEventRepository.update(id, partialEntity);
  }

  public remove(id: number) {
    return this.exchangeEventRepository.delete(id);
  }

  public async findLatestExchangeEventTimestamp() {
    const result = await this.exchangeEventRepository.findOne({
      where: {},
      order: { time: 'DESC' },
    });

    return result?.time?.getTime?.() || 0;
  }

  private async getDisposalExchangeEventsWithCostBasis(
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ExchangeEventDB[]> {
    const exchangeEvents = await this.exchangeEventRepository.find({
      where: {
        type: 'sell',
      },
      relations: [
        'disposalCostBasis',
        'disposalCostBasis.acquisitionChainEvent',
        'disposalCostBasis.acquisitionExchangeEvent',
      ],
      order: {
        time: sortOrder,
      },
    });

    return exchangeEvents;
  }

  private async getAcquisitionExchangeEventsWithCostBasis(
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ExchangeEventDB[]> {
    const exchangeEvents = await this.exchangeEventRepository.find({
      where: {
        type: 'buy',
      },
      relations: [
        'acquisitionCostBasis',
        'acquisitionCostBasis.disposalExchangeEvent',
        'acquisitionCostBasis.disposalChainEvent',
      ],
      order: {
        time: sortOrder,
      },
    });

    return exchangeEvents;
  }

  public async getLinkedDisposalExchangeEvents(
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ExchangeEventDB[]> {
    const disposalExchangeEvents =
      await this.getDisposalExchangeEventsWithCostBasis(sortOrder);

    return disposalExchangeEvents.filter(
      (event) => (event.disposalCostBasis?.length ?? 0) > 0,
    );
  }

  public async getUnlinkedDisposalExchangeEvents(
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ExchangeEventDB[]> {
    const disposalExchangeEvents =
      await this.getDisposalExchangeEventsWithCostBasis(sortOrder);

    return disposalExchangeEvents.filter(
      (event) => (event.disposalCostBasis?.length ?? 0) === 0,
    );
  }

  public async getLinkedAcquisitionExchangeEvents(
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ExchangeEventDB[]> {
    const acquisitionExchangeEvents =
      await this.getAcquisitionExchangeEventsWithCostBasis(sortOrder);

    return acquisitionExchangeEvents.filter(
      (event) => (event.acquisitionCostBasis?.length ?? 0) > 0,
    );
  }

  public async getUnlinkedAcquisitionExchangeEvents(
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<ExchangeEventDB[]> {
    const acquisitionExchangeEvents =
      await this.getAcquisitionExchangeEventsWithCostBasis(sortOrder);

    return acquisitionExchangeEvents.filter(
      (event) => (event.acquisitionCostBasis?.length ?? 0) === 0,
    );
  }
}
