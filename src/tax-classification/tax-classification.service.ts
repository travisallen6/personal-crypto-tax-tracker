import { Injectable } from '@nestjs/common';

import { CostBasisService } from '../cost-basis/cost-basis.service';
import { CostBasis } from '../cost-basis/entities/cost-basis.entity';
import { TaxClassificationType } from './types/tax-classification';
import { IncomeType } from './types/income-type';
import { Decimal } from 'decimal.js';

@Injectable()
export class TaxClassificationService {
  constructor(private readonly costBasisService: CostBasisService) {}

  private determineClassificationValues(
    costBasis: CostBasis,
  ): Pick<CostBasis, 'taxClassificationType' | 'incomeType'> {
    const acquisitionEvent = costBasis.acquisitionEvent;
    const disposalEvent = costBasis.disposalEvent;

    const incomeType = costBasis.acquisitionEvent?.isIncomeEvent
      ? IncomeType.MINING
      : IncomeType.NONE;

    const disposalUsdValue = disposalEvent?.usdValue ?? new Decimal(0);
    const acquisitionUsdValue = acquisitionEvent?.usdValue ?? new Decimal(0);

    const taxClassificationType = disposalUsdValue.greaterThan(
      acquisitionUsdValue,
    )
      ? TaxClassificationType.CAPITAL_GAIN
      : TaxClassificationType.CAPITAL_LOSS;

    return {
      taxClassificationType,
      incomeType,
    };
  }

  private async classifyCostBasis(costBasis: CostBasis) {
    await this.costBasisService.update(
      costBasis.id,
      this.determineClassificationValues(costBasis),
    );
  }

  async classifyUnclassifiedCostBasisRecords() {
    const unclassifiedCostBasisRecords =
      await this.costBasisService.findUnclassified();

    for (const costBasis of unclassifiedCostBasisRecords) {
      await this.classifyCostBasis(costBasis);
    }
  }
}
