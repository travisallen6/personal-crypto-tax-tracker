import { Module } from '@nestjs/common';
import { TaxReportService } from './tax-report.service';
import { TaxReportController } from './tax-report.controller';
import { CostBasisModule } from '../cost-basis/cost-basis.module';
import { TaxClassificationModule } from '../tax-classification/tax-classification.module';

@Module({
  imports: [CostBasisModule, TaxClassificationModule],
  controllers: [TaxReportController],
  providers: [TaxReportService],
  exports: [TaxReportService],
})
export class TaxReportModule {}
