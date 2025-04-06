import { Controller, Put } from '@nestjs/common';
import { TaxClassificationService } from './tax-classification.service';

@Controller('tax-classification')
export class TaxClassificationController {
  constructor(
    private readonly taxClassificationService: TaxClassificationService,
  ) {}

  @Put('classify')
  async classifyCostBasis(): Promise<void> {
    return this.taxClassificationService.classifyUnclassifiedCostBasisRecords();
  }
}
