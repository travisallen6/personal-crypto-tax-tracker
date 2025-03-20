import { KrakenTradeTransactionRaw } from './exchange-transaction';

export interface PaginatedExchangeResponse<T> {
  results: T;
  hasNextPage: boolean;
  currentPage: number;
  resultsCount: number;
}

export interface ExchangeEvent
  extends Omit<
    KrakenTradeTransactionRaw,
    'time' | 'price' | 'cost' | 'fee' | 'vol' | 'margin' | 'leverage'
  > {
  txid: string;
  time: Date;
  price: number;
  cost: number;
  fee: number;
  vol: number;
  margin: number;
  leverage: number;
}
