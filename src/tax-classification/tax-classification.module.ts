import { Module } from '@nestjs/common';
import { TaxClassificationService } from './tax-classification.service';
import { TaxClassificationController } from './tax-classification.controller';
import { CostBasisModule } from '../cost-basis/cost-basis.module';
@Module({
  imports: [CostBasisModule],
  controllers: [TaxClassificationController],
  providers: [TaxClassificationService],
  exports: [TaxClassificationService],
})
export class TaxClassificationModule {}
