import { Module } from '@nestjs/common';
import { ChainEventModule } from './chain-event/chain-event.module';

@Module({
  imports: [ChainEventModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
