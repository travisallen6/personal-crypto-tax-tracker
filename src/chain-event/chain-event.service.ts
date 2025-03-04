import { Injectable } from '@nestjs/common';
import { CreateChainEventDto } from './dto/create-chain-event.dto';
import { UpdateChainEventDto } from './dto/update-chain-event.dto';

@Injectable()
export class ChainEventService {
  create(createChainEventDto: CreateChainEventDto) {
    return 'This action adds a new chainEvent';
  }

  findAll() {
    return `This action returns all chainEvent`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chainEvent`;
  }

  update(id: number, updateChainEventDto: UpdateChainEventDto) {
    return `This action updates a #${id} chainEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} chainEvent`;
  }
}
