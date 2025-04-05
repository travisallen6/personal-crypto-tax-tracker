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

export interface KrakenLedgerEntry {
  aclass: string;
  amount: string;
  asset: string;
  balance: string;
  fee: string;
  refid: string;
  subtype: string;
  time: number;
  type: string;
}

export interface KrakenTradeTransactionResponse {
  count: number;
  trades: KrakenTradeTransactionDictionary;
}

export interface KrakenLedgerResponse {
  count: number;
  ledger: Record<string, KrakenLedgerEntry>;
}
