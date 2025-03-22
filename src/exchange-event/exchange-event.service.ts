import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeEvent } from './entities/exchange-event.entity';
import { CreateExchangeEventDto } from './dto/create-exchange-event';
import { UpdateExchangeEventDto } from './dto/update-exchange-event';
import { ExchangeEventSchema } from './dto/exchange-event.schema';

@Injectable()
export class ExchangeEventService {
  constructor(
    @InjectRepository(ExchangeEvent)
    private readonly exchangeEventRepository: Repository<ExchangeEvent>,
  ) {}

  private validateExchangeEvents(exchangeEvents: CreateExchangeEventDto[]) {
    exchangeEvents.forEach((exchangeEvent) => {
      ExchangeEventSchema.parse(exchangeEvent);
    });
  }

  public create(exchangeEvent: CreateExchangeEventDto) {
    return this.createMany([exchangeEvent]);
  }

  public createMany(exchangeEvents: CreateExchangeEventDto[]) {
    this.validateExchangeEvents(exchangeEvents);
    return this.exchangeEventRepository.manager
      .createQueryBuilder()
      .insert()
      .into(ExchangeEvent)
      .values(exchangeEvents)
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
      order: { time: 'DESC' },
    });

    return result?.time?.getTime?.() || 0;
  }
}
