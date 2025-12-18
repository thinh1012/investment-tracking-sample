import { Transaction, TransactionType, Asset, InterestType } from '../../types';

export interface DefaultValues {
    assetSymbol?: string;
    inputMode?: 'QUANTITY' | 'TOTAL' | 'LP';
    type?: TransactionType;
}

export interface BatchItem {
    symbol: string;
    amount: string;
    price: string;
}

export interface Reward {
    symbol: string;
    amount: string;
}

export interface LpToken {
    symbol: string;
    amount: string;
}
