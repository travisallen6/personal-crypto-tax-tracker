import { Injectable } from '@nestjs/common';

import { CostBasisService } from '../cost-basis/cost-basis.service';
import { CostBasis } from '../cost-basis/entities/cost-basis.entity';
import {
  ClassifiedCostBasis,
  TaxClassificationType,
} from './types/tax-classification';
import { IncomeType } from './types/income-type';
import { Decimal } from 'decimal.js';
import { DisposalEvent } from '../cost-basis-event/disposal-event';
import { AcquisitionEvent } from '../cost-basis-event/acquisition-event';

@Injectable()
export class TaxClassificationService {
  constructor(private readonly costBasisService: CostBasisService) {}

  private determineClassificationValues(
    costBasis: CostBasis,
  ): ClassifiedCostBasis {
    const acquisitionEvent = costBasis.acquisitionEvent;
    const disposalEvent = costBasis.disposalEvent;

    const disposalUsdValue = disposalEvent!.getUsdValueForCostBasis(
      new Decimal(costBasis.quantity),
    );

    const acquisitionUsdValue = acquisitionEvent!.getUsdValueForCostBasis(
      new Decimal(costBasis.quantity),
    );

    const incomeType = costBasis.acquisitionEvent?.isIncomeEvent
      ? IncomeType.MINING
      : IncomeType.NONE;

    const taxClassificationType = disposalUsdValue.greaterThan(
      acquisitionUsdValue,
    )
      ? TaxClassificationType.CAPITAL_GAIN
      : TaxClassificationType.CAPITAL_LOSS;

    return Object.assign(costBasis, {
      taxClassificationType,
      incomeType,
    });
  }

  async findAndClassifyCostBasisRecords() {
    const unclassifiedCostBasisRecords =
      await this.costBasisService.findAllLinked();

    return unclassifiedCostBasisRecords.map((costBasis) =>
      this.determineClassificationValues(costBasis),
    );
  }

  private filterByClassificationAndYear(
    events: ClassifiedCostBasis[],
    classificationTypes: TaxClassificationType[],
    year: number,
  ) {
    return events.filter((event) => {
      if (classificationTypes.includes(TaxClassificationType.INCOME)) {
        return (
          event.incomeType !== IncomeType.NONE &&
          (
            event.acquisitionEvent as AcquisitionEvent
          ).timestamp.getFullYear() === year
        );
      }

      return (
        classificationTypes.includes(event.taxClassificationType) &&
        (event.disposalEvent as DisposalEvent).timestamp.getFullYear() === year
      );
    });
  }

  async getIncomeTaxEvents(year: number) {
    const classifiedCostBasisRecords =
      await this.findAndClassifyCostBasisRecords();

    const incomeTaxEventsForYear = this.filterByClassificationAndYear(
      classifiedCostBasisRecords,
      [TaxClassificationType.INCOME],
      year,
    );

    return incomeTaxEventsForYear.map((event) => {
      event.taxClassificationType = TaxClassificationType.INCOME;
      return event;
    });
  }

  async getCapitalGainsTaxEvents(year: number) {
    const classifiedCostBasisRecords =
      await this.findAndClassifyCostBasisRecords();

    const capitalGainsTaxEventsForYear = this.filterByClassificationAndYear(
      classifiedCostBasisRecords,
      [TaxClassificationType.CAPITAL_GAIN, TaxClassificationType.CAPITAL_LOSS],
      year,
    );

    return capitalGainsTaxEventsForYear;
  }
}
