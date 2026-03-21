/**
 * Risk Calculation Utilities
 * Pure mathematical functions for portfolio risk analytics
 */

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Calculate the arithmetic mean of an array of numbers
 */
export function calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate the population standard deviation
 */
export function calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Calculate the sample standard deviation (uses n-1 denominator)
 */
export function calculateSampleStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
    return Math.sqrt(variance);
}

/**
 * Calculate covariance between two arrays
 * Both arrays must have the same length
 */
export function calculateCovariance(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const meanX = calculateMean(x);
    const meanY = calculateMean(y);
    
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
        sum += (x[i] - meanX) * (y[i] - meanY);
    }
    
    return sum / x.length;
}

/**
 * Calculate correlation coefficient between two arrays (-1 to 1)
 */
export function calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const cov = calculateCovariance(x, y);
    const stdDevX = calculateStdDev(x);
    const stdDevY = calculateStdDev(y);
    
    if (stdDevX === 0 || stdDevY === 0) return 0;
    
    return cov / (stdDevX * stdDevY);
}

/**
 * Calculate variance of an array
 */
export function calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

// ============================================================================
// Return Calculations
// ============================================================================

/**
 * Calculate daily/simple returns from a price series
 * Returns[i] = (Price[i] - Price[i-1]) / Price[i-1]
 */
export function calculateReturns(prices: number[]): number[] {
    if (prices.length < 2) return [];
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1] !== 0) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        } else {
            returns.push(0);
        }
    }
    return returns;
}

/**
 * Calculate log returns from a price series
 * LogReturns[i] = ln(Price[i] / Price[i-1])
 */
export function calculateLogReturns(prices: number[]): number[] {
    if (prices.length < 2) return [];
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1] > 0 && prices[i] > 0) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        } else {
            returns.push(0);
        }
    }
    return returns;
}

/**
 * Compound Annual Growth Rate (CAGR)
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param years - Number of years
 */
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
    if (startValue <= 0 || years <= 0) return 0;
    return Math.pow(endValue / startValue, 1 / years) - 1;
}

/**
 * Calculate annualized return from periodic returns
 * @param returns - Array of periodic returns (e.g., daily)
 * @param periodsPerYear - Number of periods in a year (252 for trading days)
 */
export function calculateAnnualizedReturn(returns: number[], periodsPerYear: number = 252): number {
    if (returns.length === 0) return 0;
    
    const totalReturn = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
    const years = returns.length / periodsPerYear;
    
    if (years <= 0) return 0;
    return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/**
 * Calculate annualized volatility from periodic returns
 * @param returns - Array of periodic returns
 * @param periodsPerYear - Number of periods in a year (252 for trading days)
 */
export function calculateAnnualizedVolatility(returns: number[], periodsPerYear: number = 252): number {
    if (returns.length < 2) return 0;
    return calculateStdDev(returns) * Math.sqrt(periodsPerYear);
}

// ============================================================================
// Risk Metrics
// ============================================================================

/**
 * Calculate Sharpe Ratio
 * Sharpe = (Portfolio Return - Risk Free Rate) / Portfolio Volatility
 * @param returns - Array of periodic returns
 * @param riskFreeRate - Annual risk-free rate (e.g., 0.05 for 5%)
 * @param periodsPerYear - Number of periods in a year
 */
export function calculateSharpeRatio(
    returns: number[],
    riskFreeRate: number = 0.05,
    periodsPerYear: number = 252
): number {
    if (returns.length < 2) return 0;
    
    const avgReturn = calculateMean(returns);
    const volatility = calculateStdDev(returns);
    
    if (volatility === 0) return 0;
    
    // Convert annual risk-free rate to periodic rate
    const periodicRiskFreeRate = riskFreeRate / periodsPerYear;
    
    // Calculate excess return
    const excessReturn = avgReturn - periodicRiskFreeRate;
    
    // Annualize the Sharpe ratio
    return (excessReturn / volatility) * Math.sqrt(periodsPerYear);
}

/**
 * Calculate Sortino Ratio (uses downside deviation instead of total volatility)
 * @param returns - Array of periodic returns
 * @param riskFreeRate - Annual risk-free rate
 * @param periodsPerYear - Number of periods in a year
 * @param targetReturn - Minimum acceptable return (default: 0)
 */
export function calculateSortinoRatio(
    returns: number[],
    riskFreeRate: number = 0.05,
    periodsPerYear: number = 252,
    targetReturn: number = 0
): number {
    if (returns.length < 2) return 0;
    
    const avgReturn = calculateMean(returns);
    
    // Calculate downside deviation (only negative returns below target)
    const downsideReturns = returns.filter(r => r < targetReturn);
    if (downsideReturns.length === 0) return Infinity; // No downside risk
    
    const downsideDeviation = Math.sqrt(
        downsideReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) / downsideReturns.length
    );
    
    if (downsideDeviation === 0) return 0;
    
    const periodicRiskFreeRate = riskFreeRate / periodsPerYear;
    const excessReturn = avgReturn - periodicRiskFreeRate;
    
    return (excessReturn / downsideDeviation) * Math.sqrt(periodsPerYear);
}

/**
 * Calculate maximum drawdown from a series of portfolio values
 * @param portfolioValues - Array of portfolio values over time
 * @returns Max drawdown info including percentage and indices
 */
export function calculateMaxDrawdown(portfolioValues: number[]): {
    maxDrawdown: number;
    startIndex: number;
    endIndex: number;
} {
    if (portfolioValues.length < 2) {
        return { maxDrawdown: 0, startIndex: 0, endIndex: 0 };
    }
    
    let maxDrawdown = 0;
    let startIndex = 0;
    let endIndex = 0;
    let peakIndex = 0;
    let peakValue = portfolioValues[0];
    
    for (let i = 1; i < portfolioValues.length; i++) {
        if (portfolioValues[i] > peakValue) {
            peakValue = portfolioValues[i];
            peakIndex = i;
        }
        
        const drawdown = (portfolioValues[i] - peakValue) / peakValue;
        
        if (drawdown < maxDrawdown) {
            maxDrawdown = drawdown;
            startIndex = peakIndex;
            endIndex = i;
        }
    }
    
    return {
        maxDrawdown: maxDrawdown * 100, // Convert to percentage
        startIndex,
        endIndex
    };
}

/**
 * Calculate Beta - correlation to market benchmark
 * Beta = Cov(asset, market) / Var(market)
 * @param assetReturns - Array of asset returns
 * @param benchmarkReturns - Array of benchmark returns
 */
export function calculateBeta(assetReturns: number[], benchmarkReturns: number[]): number {
    if (assetReturns.length !== benchmarkReturns.length || assetReturns.length === 0) return 1;
    
    const covariance = calculateCovariance(assetReturns, benchmarkReturns);
    const marketVariance = calculateVariance(benchmarkReturns);
    
    if (marketVariance === 0) return 1;
    
    return covariance / marketVariance;
}

/**
 * Calculate Alpha (excess return over benchmark)
 * Alpha = Asset Return - (Risk Free Rate + Beta * (Market Return - Risk Free Rate))
 * @param assetReturns - Array of asset returns
 * @param benchmarkReturns - Array of benchmark returns
 * @param riskFreeRate - Annual risk-free rate
 * @param periodsPerYear - Number of periods in a year
 */
export function calculateAlpha(
    assetReturns: number[],
    benchmarkReturns: number[],
    riskFreeRate: number = 0.05,
    periodsPerYear: number = 252
): number {
    if (assetReturns.length === 0 || benchmarkReturns.length === 0) return 0;
    
    const beta = calculateBeta(assetReturns, benchmarkReturns);
    const avgAssetReturn = calculateMean(assetReturns) * periodsPerYear;
    const avgBenchmarkReturn = calculateMean(benchmarkReturns) * periodsPerYear;
    
    // CAPM expected return
    const expectedReturn = riskFreeRate + beta * (avgBenchmarkReturn - riskFreeRate);
    
    return avgAssetReturn - expectedReturn;
}

/**
 * Calculate R-squared (coefficient of determination)
 * Represents how well the benchmark explains portfolio variance
 * @param assetReturns - Array of asset returns
 * @param benchmarkReturns - Array of benchmark returns
 */
export function calculateRSquared(assetReturns: number[], benchmarkReturns: number[]): number {
    const correlation = calculateCorrelation(assetReturns, benchmarkReturns);
    return correlation * correlation;
}

/**
 * Calculate Calmar Ratio (CAGR / Max Drawdown)
 * @param portfolioValues - Array of portfolio values over time
 * @param years - Number of years
 */
export function calculateCalmarRatio(portfolioValues: number[], years: number): number {
    if (portfolioValues.length < 2 || years <= 0) return 0;
    
    const cagr = calculateCAGR(portfolioValues[0], portfolioValues[portfolioValues.length - 1], years);
    const { maxDrawdown } = calculateMaxDrawdown(portfolioValues);
    
    const absDrawdown = Math.abs(maxDrawdown / 100); // Convert from percentage
    
    if (absDrawdown === 0) return Infinity;
    
    return cagr / absDrawdown;
}

/**
 * Calculate Value at Risk (VaR) using historical method
 * @param returns - Array of historical returns
 * @param confidenceLevel - Confidence level (e.g., 0.95 for 95%)
 * @returns VaR as a positive number representing potential loss
 */
export function calculateVaR(returns: number[], confidenceLevel: number = 0.95): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    
    // Return the absolute value of the loss at the confidence level
    return Math.abs(sortedReturns[index] || 0) * 100; // As percentage
}

/**
 * Calculate Conditional Value at Risk (CVaR) / Expected Shortfall
 * Average of returns worse than VaR
 * @param returns - Array of historical returns
 * @param confidenceLevel - Confidence level (e.g., 0.95 for 95%)
 */
export function calculateCVaR(returns: number[], confidenceLevel: number = 0.95): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    
    if (cutoffIndex === 0) return Math.abs(sortedReturns[0] || 0) * 100;
    
    const tailReturns = sortedReturns.slice(0, cutoffIndex);
    const avgTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    return Math.abs(avgTailReturn) * 100; // As percentage
}

// ============================================================================
// Diversification Metrics
// ============================================================================

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for concentration
 * HHI = sum of squared market shares (as percentages)
 * 0 = perfectly diversified, 10000 = single asset
 * @param allocations - Array of allocation percentages (0-1 or 0-100)
 * @returns HHI score (0-10000)
 */
export function calculateHHI(allocations: number[]): number {
    if (allocations.length === 0) return 0;
    
    // Normalize to percentages (0-100)
    const percentages = allocations.map(a => {
        const val = Math.abs(a);
        return val > 1 ? val : val * 100;
    });
    
    return percentages.reduce((sum, p) => sum + p * p, 0);
}

/**
 * Calculate diversification score (normalized 0-100)
 * Higher score = more diversified
 * @param allocations - Array of allocation percentages
 */
export function calculateDiversificationScore(allocations: number[]): number {
    if (allocations.length === 0) return 0;
    if (allocations.length === 1) return 0;
    
    const hhi = calculateHHI(allocations);
    
    // Normalize: Perfect diversification for N assets gives HHI = 10000/N
    // Score = 100 - (HHI / 100) gives rough 0-100 scale
    const score = Math.max(0, Math.min(100, 100 - (hhi / 100)));
    
    return score;
}

/**
 * Calculate effective number of assets (inverse HHI)
 * @param allocations - Array of allocation percentages
 */
export function calculateEffectiveN(allocations: number[]): number {
    if (allocations.length === 0) return 0;
    
    // Use decimal weights (0-1)
    const weights = allocations.map(a => {
        const val = Math.abs(a);
        return val > 1 ? val / 100 : val;
    });
    
    const sumSquaredWeights = weights.reduce((sum, w) => sum + w * w, 0);
    
    if (sumSquaredWeights === 0) return 0;
    
    return 1 / sumSquaredWeights;
}

/**
 * Get concentration risk level based on HHI
 * @param hhi - Herfindahl-Hirschman Index
 */
export function getConcentrationRiskLevel(hhi: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CONCENTRATED' {
    if (hhi < 1500) return 'LOW';
    if (hhi < 2500) return 'MODERATE';
    if (hhi < 5000) return 'HIGH';
    return 'CONCENTRATED';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate percentile of a value in a distribution
 */
export function calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)];
}

/**
 * Calculate median
 */
export function calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate skewness of returns distribution
 * Positive = right tail, Negative = left tail
 */
export function calculateSkewness(values: number[]): number {
    if (values.length < 3) return 0;
    
    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values);
    
    if (stdDev === 0) return 0;
    
    const n = values.length;
    const sumCubedDeviations = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0);
    
    return (n / ((n - 1) * (n - 2))) * sumCubedDeviations;
}

/**
 * Calculate kurtosis of returns distribution
 * High kurtosis = fat tails (more extreme events)
 */
export function calculateKurtosis(values: number[]): number {
    if (values.length < 4) return 0;
    
    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values);
    
    if (stdDev === 0) return 0;
    
    const n = values.length;
    const sumFourthPowers = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 4), 0);
    
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumFourthPowers -
        (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}

/**
 * Calculate tracking error (standard deviation of return differences)
 * @param portfolioReturns - Array of portfolio returns
 * @param benchmarkReturns - Array of benchmark returns
 */
export function calculateTrackingError(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length === 0) return 0;
    
    const differences = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
    return calculateStdDev(differences);
}

/**
 * Calculate Information Ratio (active return / tracking error)
 * @param portfolioReturns - Array of portfolio returns
 * @param benchmarkReturns - Array of benchmark returns
 */
export function calculateInformationRatio(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length === 0) return 0;
    
    const activeReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
    const avgActiveReturn = calculateMean(activeReturns);
    const trackingError = calculateStdDev(activeReturns);
    
    if (trackingError === 0) return 0;
    
    return avgActiveReturn / trackingError;
}

/**
 * Calculate win rate (percentage of positive returns)
 * @param returns - Array of returns
 */
export function calculateWinRate(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const positiveReturns = returns.filter(r => r > 0).length;
    return (positiveReturns / returns.length) * 100;
}

/**
 * Calculate profit factor (gross profit / gross loss)
 * @param returns - Array of returns
 */
export function calculateProfitFactor(returns: number[]): number {
    const grossProfit = returns.filter(r => r > 0).reduce((sum, r) => sum + r, 0);
    const grossLoss = Math.abs(returns.filter(r => r < 0).reduce((sum, r) => sum + r, 0));
    
    if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
    
    return grossProfit / grossLoss;
}
