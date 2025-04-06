import { Module } from '@nestjs/common';
import { TaxClassificationService } from './tax-classification.service';
import { CostBasisModule } from '../cost-basis/cost-basis.module';
@Module({
  imports: [CostBasisModule],
  providers: [TaxClassificationService],
  exports: [TaxClassificationService],
})
export class TaxClassificationModule {}
