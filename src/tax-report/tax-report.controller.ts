import { Controller, Get, Param } from '@nestjs/common';
import {
  CapitalGainsTaxReportAggregate,
  IncomeTaxReportAggregate,
} from './entities/tax-event.schema';
import { TaxReportService } from './tax-report.service';

@Controller('tax-report')
export class TaxReportController {
  constructor(private readonly taxCalculationService: TaxReportService) {}

  @Get('capital-gains/:year')
  async calculateCapitalGains(
    @Param('year') year: number,
  ): Promise<CapitalGainsTaxReportAggregate> {
    return this.taxCalculationService.calculateCapitalGains(+year);
  }

  @Get('income/:year')
  async calculateIncome(
    @Param('year') year: number,
  ): Promise<IncomeTaxReportAggregate> {
    return this.taxCalculationService.calculateIncome(+year);
  }
}
