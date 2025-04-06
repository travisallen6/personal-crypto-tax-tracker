import { CostBasis } from '../../cost-basis/entities/cost-basis.entity';
import { IncomeType } from './income-type';

export enum TaxClassificationType {
  CAPITAL_GAIN = 'CAPITAL_GAIN',
  CAPITAL_LOSS = 'CAPITAL_LOSS',
  INCOME = 'INCOME',
  OTHER = 'OTHER',
}

export type ClassifiedCostBasis = CostBasis & {
  taxClassificationType: TaxClassificationType;
  incomeType: IncomeType;
};
