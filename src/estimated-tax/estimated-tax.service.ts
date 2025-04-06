import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstimatedTax } from './entities/estimated-tax.entity';
import { CreateEstimatedTaxDto } from './dto/create-estimated-tax.dto';

@Injectable()
export class EstimatedTaxService {
  constructor(
    @InjectRepository(EstimatedTax)
    private readonly estimatedTaxRepository: Repository<EstimatedTax>,
  ) {}

  async create(
    createEstimatedTaxDto: CreateEstimatedTaxDto,
  ): Promise<EstimatedTax> {
    const estimatedTax = this.estimatedTaxRepository.create(
      createEstimatedTaxDto,
    );
    return this.estimatedTaxRepository.save(estimatedTax);
  }

  async findAll(): Promise<EstimatedTax[]> {
    return this.estimatedTaxRepository.find();
  }

  async findOne(id: string): Promise<EstimatedTax> {
    const estimatedTax = await this.estimatedTaxRepository.findOne({
      where: { id },
    });
    if (!estimatedTax) {
      throw new NotFoundException(
        `Estimated tax payment with ID ${id} not found`,
      );
    }
    return estimatedTax;
  }

  async update(
    id: string,
    updateEstimatedTaxDto: Partial<CreateEstimatedTaxDto>,
  ): Promise<EstimatedTax> {
    await this.estimatedTaxRepository.update(id, updateEstimatedTaxDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.estimatedTaxRepository.delete(id);
  }
}
