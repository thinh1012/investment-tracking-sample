import { DBSchema } from 'idb';
import { Transaction, NotificationLog, NotificationSettings } from '../../types';

export interface WatchlistItem {
    id: string;
    symbol: string;
    targetBuyPrice?: number;
    targetSellPrice?: number;
    expectedQty?: number;
    boughtQty?: number;
    note?: string;
    createdAt: number;
}

export interface MarketPick {
    symbol: string;
    addedAt: number;
    note?: string;
}

export interface CryptoDB extends DBSchema {
    transactions: {
        key: string;
        value: Transaction;
        indexes: { 'by-date': string; 'by-symbol': string };
    };
    logs: {
        key: string;
        value: NotificationLog;
        indexes: { 'by-date': number; 'by-status': string };
    };
    watchlist: {
        key: string;
        value: WatchlistItem;
    };
    market_picks: {
        key: string;
        value: MarketPick;
    };
    settings: {
        key: string;
        value: NotificationSettings;
    };
    manual_prices: {
        key: string;
        value: { symbol: string; price: number };
    };
    asset_overrides: {
        key: string;
        value: { symbol: string; avgBuyPrice?: number; rewardTokens?: string[] };
    };
    historical_prices: {
        key: string;
        value: { symbol: string; date: string; open: number; close: number; id: string };
        indexes: { 'by-symbol': string; 'by-date': string };
    };
    manual_historical_prices: {
        key: string;
        value: { symbol: string; open: number; date: string; id: string };
        indexes: { 'by-symbol': string };
    };
}

export const DB_NAME = 'crypto-investment-db';
export const DB_VERSION = 7;
