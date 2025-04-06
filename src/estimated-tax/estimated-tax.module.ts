import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstimatedTax } from './entities/estimated-tax.entity';
import { EstimatedTaxService } from './estimated-tax.service';
import { EstimatedTaxController } from './estimated-tax.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EstimatedTax])],
  controllers: [EstimatedTaxController],
  providers: [EstimatedTaxService],
  exports: [EstimatedTaxService],
})
export class EstimatedTaxModule {}
