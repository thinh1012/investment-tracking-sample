/**
 * Portfolio Analytics Types
 * Type definitions for advanced portfolio risk metrics and analytics
 */

import { Transaction } from '../types';
import { PriceData } from '../services/PriceService';

// ============================================================================
// Risk Metrics Types
// ============================================================================

export interface RiskMetrics {
    /** Sharpe Ratio - risk-adjusted return (higher is better, >2 is excellent) */
    sharpeRatio: number;
    /** Annualized volatility as a percentage (standard deviation of returns) */
    volatility: number;
    /** Maximum drawdown information */
    maxDrawdown: MaxDrawdownInfo;
    /** Beta coefficient relative to market benchmark (BTC) */
    beta: number;
    /** Value at Risk at 95% confidence level */
    var95: number;
    /** Value at Risk at 99% confidence level */
    var99: number;
}

export interface MaxDrawdownInfo {
    /** Maximum drawdown as a percentage (0 to -100) */
    maxDrawdown: number;
    /** Index in the portfolio values array where the peak occurred */
    startIndex: number;
    /** Index in the portfolio values array where the trough occurred */
    endIndex: number;
    /** Date of the peak (if available) */
    peakDate?: string;
    /** Date of the trough (if available) */
    troughDate?: string;
    /** Recovery information (if recovered) */
    recovered?: boolean;
    recoveryDate?: string;
}

// ============================================================================
// Diversification Types
// ============================================================================

export interface DiversificationMetrics {
    /** Herfindahl-Hirschman Index (0-10000, lower is more diversified) */
    hhi: number;
    /** Normalized diversification score (0-100, higher is more diversified) */
    score: number;
    /** Number of unique assets in portfolio */
    assetCount: number;
    /** Effective number of assets (accounts for concentration) */
    effectiveN: number;
    /** Concentration risk level */
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CONCENTRATED';
    /** Top allocations by percentage */
    topAllocations: AllocationItem[];
}

export interface AllocationItem {
    symbol: string;
    percentage: number;
    value: number;
    sector?: string;
}

export interface SectorAllocation {
    sector: string;
    percentage: number;
    value: number;
    assets: string[];
}

// ============================================================================
// Performance Metrics Types
// ============================================================================

export interface PerformanceMetrics {
    /** Total return as a percentage */
    totalReturn: number;
    /** Compound Annual Growth Rate */
    cagr: number;
    /** Annualized return percentage */
    annualizedReturn: number;
    /** Best monthly return */
    bestMonth: number;
    /** Worst monthly return */
    worstMonth: number;
    /** Win rate percentage (positive months) */
    winRate: number;
    /** Profit factor (gross profit / gross loss) */
    profitFactor: number;
    /** Calmar ratio (CAGR / Max Drawdown) */
    calmarRatio: number;
    /** Sortino ratio (downside risk-adjusted return) */
    sortinoRatio: number;
}

// ============================================================================
// Correlation Types
// ============================================================================

export interface CorrelationMatrix {
    /** Asset symbols */
    symbols: string[];
    /** Correlation coefficients matrix (-1 to 1) */
    matrix: number[][];
    /** Average correlation of each asset to others */
    averageCorrelations: Record<string, number>;
}

export interface BenchmarkComparison {
    /** Benchmark symbol (typically BTC) */
    benchmarkSymbol: string;
    /** Portfolio beta */
    beta: number;
    /** Correlation coefficient */
    correlation: number;
    /** Portfolio alpha (excess return) */
    alpha: number;
    /** R-squared (how well benchmark explains portfolio variance) */
    rSquared: number;
    /** Tracking error */
    trackingError: number;
    /** Information ratio */
    informationRatio: number;
}

// ============================================================================
// Portfolio Metrics (Combined)
// ============================================================================

export interface PortfolioMetrics {
    /** Risk metrics */
    risk: RiskMetrics;
    /** Diversification metrics */
    diversification: DiversificationMetrics;
    /** Performance metrics */
    performance: PerformanceMetrics;
    /** Benchmark comparison (vs BTC) */
    benchmark: BenchmarkComparison;
    /** Asset allocation breakdown */
    allocation: AllocationBreakdown;
    /** Historical values for charting */
    historical: HistoricalData;
    /** Metadata */
    metadata: MetricsMetadata;
}

export interface AllocationBreakdown {
    /** By individual asset */
    byAsset: AllocationItem[];
    /** By sector (if metadata available) */
    bySector: SectorAllocation[];
    /** By market cap tier */
    byMarketCap: MarketCapAllocation[];
}

export interface MarketCapAllocation {
    tier: 'LARGE' | 'MID' | 'SMALL' | 'MICRO' | 'UNKNOWN';
    percentage: number;
    value: number;
    assets: string[];
}

export interface HistoricalData {
    /** Portfolio value over time */
    portfolioValues: { date: string; value: number }[];
    /** Daily returns */
    returns: { date: string; return: number }[];
    /** Cumulative returns */
    cumulativeReturns: { date: string; value: number }[];
    /** Rolling volatility (30-day) */
    rollingVolatility: { date: string; value: number }[];
}

export interface MetricsMetadata {
    /** Calculation timestamp */
    calculatedAt: number;
    /** Data period start */
    periodStart?: string;
    /** Data period end */
    periodEnd?: string;
    /** Number of data points used */
    dataPoints: number;
    /** Currency used for calculations */
    currency: string;
    /** Risk-free rate used (annualized) */
    riskFreeRate: number;
}

// ============================================================================
// Asset Metadata Types (for sector/categorization)
// ============================================================================

export interface AssetMetadata {
    symbol: string;
    /** Asset category/sector */
    sector?: string;
    /** Market cap in USD */
    marketCap?: number;
    /** Market cap tier */
    marketCapTier?: 'LARGE' | 'MID' | 'SMALL' | 'MICRO';
    /** Asset type */
    type?: 'L1' | 'L2' | 'DEFI' | 'STABLECOIN' | 'MEME' | 'RWA' | 'AI' | 'GAMING' | 'OTHER';
    /** Chain ecosystem */
    chain?: string;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface RiskChartData {
    /** For drawdown chart */
    drawdownSeries: { date: string; value: number }[];
    /** For volatility gauge */
    currentVolatility: number;
    /** Volatility histogram buckets */
    volatilityDistribution: { range: string; count: number }[];
}

export interface AllocationChartData {
    /** Pie chart data */
    pieData: { name: string; value: number; percentage: number }[];
    /** Treemap data */
    treemapData: TreemapNode[];
    /** Sunburst data */
    sunburstData: SunburstNode;
}

export interface TreemapNode {
    name: string;
    value?: number;
    children?: TreemapNode[];
}

export interface SunburstNode {
    name: string;
    value?: number;
    children?: SunburstNode[];
}

// ============================================================================
// Service Input Types
// ============================================================================

export interface PortfolioAnalyticsInput {
    transactions: Transaction[];
    prices: Record<string, number>;
    priceHistory?: Record<string, { date: string; price: number }[]>;
    assetMetadata?: Record<string, AssetMetadata>;
    riskFreeRate?: number;
    benchmarkSymbol?: string;
}

export interface CalculationOptions {
    /** Annual risk-free rate (default: 0.05 for 5%) */
    riskFreeRate?: number;
    /** Confidence level for VaR (default: 0.95) */
    varConfidenceLevel?: number;
    /** Period for volatility calculation in days (default: 30) */
    volatilityPeriod?: number;
    /** Benchmark symbol (default: BTC) */
    benchmarkSymbol?: string;
    /** Include metadata in results */
    includeMetadata?: boolean;
}
