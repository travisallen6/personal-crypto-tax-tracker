import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { CostBasis } from './entities/cost-basis.entity';
import { CreateCostBasisDto } from './dto/create-cost-basis.dto';
import { UpdateCostBasisDto } from './dto/update-cost-basis.dto';

type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;

@Injectable()
export class CostBasisService {
  constructor(
    @InjectRepository(CostBasis)
    private costBasisRepository: Repository<CostBasis>,
  ) {}

  async create(
    createCostBasisDto: WithoutTimestamps<CreateCostBasisDto>,
  ): Promise<CostBasis> {
    const costBasis = this.costBasisRepository.create(createCostBasisDto);
    const result = await this.costBasisRepository.save(costBasis);

    return result;
  }

  async createMany(
    createCostBasisDtos: WithoutTimestamps<CreateCostBasisDto>[],
  ): Promise<CostBasis[]> {
    const costBasis = this.costBasisRepository.create(createCostBasisDtos);
    const result = await this.costBasisRepository.save(costBasis);

    return result;
  }

  async findAll(): Promise<CostBasis[]> {
    return this.costBasisRepository.find({
      where: {},
      relations: [
        'acquisitionChainEvent',
        'acquisitionExchangeEvent',
        'disposalChainEvent',
        'disposalExchangeEvent',
      ],
    });
  }

  async findAllLinked(): Promise<CostBasis[]> {
    return this.costBasisRepository.find({
      where: [
        { acquisitionChainEventId: Not(IsNull()) },
        { disposalChainEventId: Not(IsNull()) },
        { acquisitionExchangeEventId: Not(IsNull()) },
        { disposalExchangeEventId: Not(IsNull()) },
      ],
      relations: [
        'acquisitionChainEvent',
        'acquisitionChainEvent.cryptoPrice',
        'acquisitionExchangeEvent',
        'disposalChainEvent',
        'disposalChainEvent.cryptoPrice',
        'disposalExchangeEvent',
      ],
    });
  }

  async findOne(id: number): Promise<CostBasis | null> {
    return this.costBasisRepository.findOne({
      where: { id },
      relations: [
        'acquisitionChainEvent',
        'acquisitionChainEvent.cryptoPrice',
        'acquisitionExchangeEvent',
        'disposalChainEvent',
        'disposalChainEvent.cryptoPrice',
        'disposalExchangeEvent',
      ],
    });
  }

  async update(
    id: number,
    updateCostBasisDto: UpdateCostBasisDto,
  ): Promise<CostBasis | null> {
    await this.costBasisRepository.update(id, updateCostBasisDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.costBasisRepository.delete(id);
  }
}
