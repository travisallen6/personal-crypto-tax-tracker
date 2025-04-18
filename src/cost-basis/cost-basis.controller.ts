import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { CostBasisService } from './cost-basis.service';
import { CreateCostBasisDto } from './dto/create-cost-basis.dto';
import { UpdateCostBasisDto } from './dto/update-cost-basis.dto';
import { CostBasisSyncService } from './cost-basis-sync.service';
@Controller('cost-basis')
export class CostBasisController {
  constructor(
    private readonly costBasisService: CostBasisService,
    private readonly costBasisSyncService: CostBasisSyncService,
  ) {}

  @Post()
  create(@Body() createCostBasisDto: CreateCostBasisDto) {
    return this.costBasisService.create(createCostBasisDto);
  }

  @Get()
  findAll() {
    return this.costBasisService.findAll();
  }

  @Post('validate')
  async validateCostBasis() {
    const errors =
      await this.costBasisSyncService.validateLinkedAcquisitionEvents();
    return {
      success: errors.length === 0,
      errors,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const costBasis = await this.costBasisService.findOne(+id);
    if (!costBasis) {
      throw new NotFoundException(`Cost basis record with ID ${id} not found`);
    }
    return costBasis;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCostBasisDto: UpdateCostBasisDto,
  ) {
    const updated = await this.costBasisService.update(+id, updateCostBasisDto);
    if (!updated) {
      throw new NotFoundException(`Cost basis record with ID ${id} not found`);
    }
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const costBasis = await this.costBasisService.findOne(+id);
    if (!costBasis) {
      throw new NotFoundException(`Cost basis record with ID ${id} not found`);
    }
    await this.costBasisService.remove(+id);
    return { success: true };
  }

  @Post('sync')
  async syncCostBasis(@Body() body: { userAddresses: string[] }) {
    return this.costBasisSyncService.syncCostBasis(body.userAddresses);
  }
}
