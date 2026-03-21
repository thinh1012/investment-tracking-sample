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

export interface ScoutSource {
    id: string;
    name: string;
    url: string;
    category: 'CHAIN' | 'PROTOCOL' | 'YIELD' | 'NEWS' | 'GLOBAL' | 'SENTIMENT';
    tags: string[];
    targetSelector?: string; // CSS selector to find the metric
    targetLabel?: string;    // Human name for the metric
    captureDelay?: number;   // Seconds to wait for page load/data fetch
    randomFactor?: number;   // Jitter (e.g. 0-5s random addition)
    createdAt: number;
}

export interface ScoutReport {
    timestamp: number;
    stables: {
        totalCap: number; // in billions
        change24h: number;
    };
    ecosystems: {
        [key: string]: {
            tvl: number; // in millions/billions
            change7d: number;
        }
    };
    sentiment: {
        value: number; // 0-100
        label: string;
    };
    dominance: {
        btc: number;
        eth?: number;
        usdt: number;
        usdc: number;
        others: number;
        othersMarketCap: number; // in billions
    };
    yields?: {
        symbol: string;
        pool: string;
        project: string;
        apy: number;
        tvlUsd: number;
    }[];
    bridgeFlows?: {
        total24h: number; // in millions
        topChains: { chain: string; volume: number }[];
    };
    chainStats?: {
        [slug: string]: {
            tvl: number;
            change24h: number;
            revenue24h: number;
            fees24h: number;
        }
    };
    // [GOLDEN_RECORD] Verified prices from Agentic/Manual sources.
    prices?: {
        [symbol: string]: number;
    };
    globalDeFi?: {
        marketCap: number; // in billions
        volume24h: number; // in billions
    };
    globalCrypto?: {
        marketCap: number; // in billions
        volume24h: number; // in billions
    };
    altcoinSeasonIndex?: number; // 0-100
    trustedSources?: {
        [slug: string]: string; // Slug -> URL
    };
    // [ETF_INTELLIGENCE] Daily ETF flow data from Coinglass
    etfFlows?: {
        btc?: { date: string; inflow: number }; // inflow in millions USD
        eth?: { date: string; inflow: number };
        sol?: { date: string; inflow: number };
    };
    scoutNote?: string;
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
        value: { symbol: string; price: number; source?: string };
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
    strategist_intel: {
        key: string;
        value: {
            symbol: string;
            metrics: Record<string, any>;
            verdict: string;
            rating: 'GOOD' | 'BAD' | 'RISKY' | 'STRONG BUY';
            signalStrength: number;
            signalType: 'HOLDING' | 'WATCHLIST' | 'OPPORTUNITY';
            updatedAt: number;
        };
    };
    scout_reports: {
        key: number;
        value: ScoutReport;
    };
    scout_sources: {
        key: string;
        value: ScoutSource;
        indexes: { 'by-category': string };
    };
}

export const DB_NAME = 'crypto-investment-db';
export const DB_VERSION = 15;
