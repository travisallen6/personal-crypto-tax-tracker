import { Module } from '@nestjs/common';
import { CostBasisService } from './cost-basis.service';
import { CostBasisController } from './cost-basis.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostBasis } from './entities/cost-basis.entity';
  
@Module({
  imports: [
    TypeOrmModule.forFeature([CostBasis]),
  ],
  controllers: [CostBasisController],
  providers: [CostBasisService],
  exports: [CostBasisService],
})
export class CostBasisModule {}
