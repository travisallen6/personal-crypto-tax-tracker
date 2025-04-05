import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ChainEventService } from './chain-event.service';
import { CreateChainEventDto } from './dto/create-chain-event.dto';
import { UpdateChainEventDto } from './dto/update-chain-event.dto';
import { ChainEventSyncService } from './chain-event-sync.service';
import Decimal from 'decimal.js';

@Controller('chain-event')
export class ChainEventController {
  constructor(
    private readonly chainEventService: ChainEventService,
    private readonly chainEventSyncService: ChainEventSyncService,
  ) {}

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
  update(
    @Param('id') id: string,
    @Body() updateChainEventDto: UpdateChainEventDto,
  ) {
    return this.chainEventService.update(+id, updateChainEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chainEventService.remove(+id);
  }

  @Post('bulk')
  bulkCreate(
    @Body('transactionHashes') transactionHashes: string[],
    @Body('recipientAddress') recipientAddress: string,
  ) {
    return this.chainEventSyncService.createChainEventsFromTransactionHashes(
      transactionHashes,
      recipientAddress,
    );
  }

  @Put('adjust/:id')
  async adjust(
    @Param('id') id: string,
    @Body('adjustmentQuantity') adjustmentQuantity: string,
  ) {
    const result = await this.chainEventSyncService.adjustTransactionValue(
      id,
      new Decimal(adjustmentQuantity),
    );

    return result;
  }

  @Post('sync')
  syncChainEvents(@Body('address') address: string) {
    return this.chainEventSyncService.syncChainEvents(address);
  }

  @Post('sync/prices')
  syncChainEventsWithCryptoPrices() {
    return this.chainEventSyncService.syncChainEventsWithCryptoPrices();
  }
}
