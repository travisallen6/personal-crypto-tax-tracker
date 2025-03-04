import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChainEventService } from './chain-event.service';
import { CreateChainEventDto } from './dto/create-chain-event.dto';
import { UpdateChainEventDto } from './dto/update-chain-event.dto';

@Controller('chain-event')
export class ChainEventController {
  constructor(private readonly chainEventService: ChainEventService) {}

  @Post()
  create(@Body() createChainEventDto: CreateChainEventDto) {
    return this.chainEventService.create(createChainEventDto);
  }

  @Get()
  findAll() {
    return this.chainEventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chainEventService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChainEventDto: UpdateChainEventDto) {
    return this.chainEventService.update(+id, updateChainEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chainEventService.remove(+id);
  }
}
