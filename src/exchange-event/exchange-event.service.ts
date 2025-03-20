import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeEvent } from './entities/exchange-event.entity';

@Injectable()
export class ExchangeEventService {
  constructor(
    @InjectRepository(ExchangeEvent)
    private readonly exchangeEventRepository: Repository<ExchangeEvent>,
  ) {}

  create(exchangeEvent: ExchangeEvent) {
    return this.createMany([exchangeEvent]);
  }

  createMany(exchangeEvents: ExchangeEvent[]) {
    return this.exchangeEventRepository.manager
      .createQueryBuilder()
      .insert()
      .into(ExchangeEvent)
      .values(exchangeEvents)
      .orIgnore()
      .execute();
  }

  findAll() {
    return this.exchangeEventRepository.find();
  }

  findOne(id: number) {
    return this.exchangeEventRepository.findOne({ where: { id } });
  }

  update(id: number, partialEntity: Partial<ExchangeEvent>) {
    return this.exchangeEventRepository.update(id, partialEntity);
  }

  remove(id: number) {
    return this.exchangeEventRepository.delete(id);
  }

  findLatestExchangeEventTimestamp() {
    return this.exchangeEventRepository.findOne({
      order: { time: 'DESC' },
    });
  }
}
