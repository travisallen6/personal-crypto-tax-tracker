import { ExchangeEvent } from './exchange-event';

export interface KrakenTradeTransaction
  extends Omit<
    ExchangeEvent,
    | 'time'
    | 'price'
    | 'cost'
    | 'fee'
    | 'vol'
    | 'margin'
    | 'leverage'
    | 'baseCurrency'
    | 'quoteCurrency'
  > {
  time: number;
  price: string;
  cost: string;
  fee: string;
  vol: string;
  margin: string;
  leverage: string;
}

export type KrakenTradeTransactionDictionary = Record<
  string,
  Omit<KrakenTradeTransaction, 'txid'>
>;

export interface KrakenTradeTransactionResponse {
  count: number;
  trades: KrakenTradeTransactionDictionary;
}
