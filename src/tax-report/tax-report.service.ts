import { Injectable } from '@nestjs/common';
import { TaxClassificationService } from '../tax-classification/tax-classification.service';
import {
  ClassifiedCostBasis,
  TaxClassificationType,
} from '../tax-classification/types/tax-classification';
import {
  CapitalGainsTaxReportAggregate,
  CapitalGainsTaxReportTotals,
  IncomeTaxReportAggregate,
  TaxEvent,
} from './entities/tax-event.schema';
import { AcquisitionEvent } from '../cost-basis-event/acquisition-event';
import { DisposalEvent } from '../cost-basis-event/disposal-event';
import { ONE_YEAR_IN_MS } from '../config/constants';
import Decimal from 'decimal.js';

@Injectable()
export class TaxReportService {
  constructor(
    private readonly taxClassificationService: TaxClassificationService,
  ) {}

  private calculateHoldingPeriod(
    acquisitionDate: Date,
    disposalDate: Date,
  ): number {
    const diffTime = Math.abs(
      disposalDate.getTime() - acquisitionDate.getTime(),
    );
    return Math.ceil(diffTime / ONE_YEAR_IN_MS);
  }

  private convertCostBasisToTaxEvent = (
    costBasis: ClassifiedCostBasis,
  ): TaxEvent => {
    const acquisitionEvent = costBasis.acquisitionEvent as AcquisitionEvent;
    const disposalEvent = costBasis.disposalEvent as DisposalEvent;
    const classificationType = costBasis.taxClassificationType;

    const costBasisQuantity = new Decimal(costBasis.quantity);

    if (classificationType === TaxClassificationType.INCOME) {
      return {
        classification: classificationType,
        amount: costBasisQuantity.toNumber(),
        costBasisAmount: 0,
        proceedsAmount: acquisitionEvent
          .getUsdValueForCostBasis(costBasisQuantity)
          .toNumber(),
        gainOrLoss: 0,
        isLongTerm: null,
        taxYear: disposalEvent.timestamp.getFullYear(),
        disposalTimestamp: disposalEvent.timestamp,
        acquisitionTimestamp: acquisitionEvent.timestamp,
        costBasisId: costBasis.id,
      };
    }

    const disposalUsdValue =
      disposalEvent.getUsdValueForCostBasis(costBasisQuantity);

    const acquisitionUsdValue =
      acquisitionEvent.getUsdValueForCostBasis(costBasisQuantity);

    const gainOrLoss = disposalUsdValue.minus(acquisitionUsdValue);

    return {
      classification: gainOrLoss.gt(0)
        ? TaxClassificationType.CAPITAL_GAIN
        : TaxClassificationType.CAPITAL_LOSS,
      amount: costBasisQuantity.toNumber(),
      costBasisAmount: acquisitionUsdValue.toNumber(),
      proceedsAmount: disposalUsdValue.toNumber(),
      gainOrLoss: gainOrLoss.toNumber(),
      isLongTerm:
        this.calculateHoldingPeriod(
          acquisitionEvent.timestamp,
          disposalEvent.timestamp,
        ) >= 365,
      taxYear: disposalEvent.timestamp.getFullYear(),
      disposalTimestamp: disposalEvent.timestamp,
      acquisitionTimestamp: acquisitionEvent.timestamp,
      costBasisId: costBasis.id,
    };
  };

  private aggregateIncomeTaxEvents(
    events: TaxEvent[],
  ): IncomeTaxReportAggregate {
    const initialValue: IncomeTaxReportAggregate = {
      amountTotal: 0,
      proceedsTotal: 0,
      events,
    };
    return events.reduce(
      (acc, event) => ({
        amountTotal: new Decimal(acc.amountTotal).plus(event.amount).toNumber(),
        proceedsTotal: new Decimal(acc.proceedsTotal)
          .plus(event.proceedsAmount)
          .toNumber(),
        events: acc.events,
      }),
      initialValue,
    );
  }

  private aggregateCapitalGainsTaxTotals(
    events: TaxEvent[],
  ): CapitalGainsTaxReportTotals {
    const initialValue: CapitalGainsTaxReportTotals = {
      amountTotal: 0,
      gainOrLossTotal: 0,
      proceedsTotal: 0,
      costBasisTotal: 0,
    };
    return events.reduce(
      (acc, event) => ({
        amountTotal: new Decimal(acc.amountTotal).plus(event.amount).toNumber(),
        gainOrLossTotal: new Decimal(acc.gainOrLossTotal)
          .plus(event.gainOrLoss)
          .toNumber(),
        proceedsTotal: new Decimal(acc.proceedsTotal)
          .plus(event.proceedsAmount)
          .toNumber(),
        costBasisTotal: new Decimal(acc.costBasisTotal)
          .plus(event.costBasisAmount)
          .toNumber(),
      }),
      initialValue,
    );
  }

  private aggregateCapitalGainsTaxEvents(
    events: TaxEvent[],
  ): CapitalGainsTaxReportAggregate {
    return {
      totals: this.aggregateCapitalGainsTaxTotals(events),
      shortTerm: this.aggregateCapitalGainsTaxTotals(
        events.filter((event) => event.isLongTerm === false),
      ),
      longTerm: this.aggregateCapitalGainsTaxTotals(
        events.filter((event) => event.isLongTerm === true),
      ),
      events,
    };
  }

  async calculateCapitalGains(
    year: number,
  ): Promise<CapitalGainsTaxReportAggregate> {
    const capitalGains =
      await this.taxClassificationService.getCapitalGainsTaxEvents(year);

    const capitalGainsEvents = capitalGains.map(
      this.convertCostBasisToTaxEvent,
    );

    return this.aggregateCapitalGainsTaxEvents(capitalGainsEvents);
  }

  async calculateIncome(year: number): Promise<IncomeTaxReportAggregate> {
    const income = await this.taxClassificationService.getIncomeTaxEvents(year);

    const incomeEvents = income.map(this.convertCostBasisToTaxEvent);

    return this.aggregateIncomeTaxEvents(incomeEvents);
  }
}
