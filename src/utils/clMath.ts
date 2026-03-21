/**
 * Uniswap V3 / Concentrated Liquidity Mathematical Formulas
 * Reference: Uniswap V3 Whitepaper
 */

export interface CLPosition {
    amount0: number; // Base Asset (e.g. ETH)
    amount1: number; // Quote Asset (e.g. USDC)
    liquidity: number;
}

/**
 * Calculates liquidity (L) for a given amount of Token 1 (Quote) and price range.
 * L = y / (sqrt(P) - sqrt(Pa))
 */
export const getLiquidityFromAmount1 = (sqrtP: number, sqrtPa: number, amount1: number): number => {
    return amount1 / (sqrtP - sqrtPa);
};

/**
 * Calculates liquidity (L) for a given amount of Token 0 (Base) and price range.
 * L = x * (sqrt(P) * sqrt(Pb)) / (sqrt(Pb) - sqrt(P))
 */
export const getLiquidityFromAmount0 = (sqrtP: number, sqrtPb: number, amount0: number): number => {
    return (amount0 * sqrtP * sqrtPb) / (sqrtPb - sqrtP);
};

/**
 * Calculates the amount of tokens required for a given total deposit value (in Quote) 
 * at a specific price and range.
 */
export const calculateRequiredAmounts = (
    currentPrice: number,
    lowerPrice: number,
    upperPrice: number,
    depositValueUsdc: number
): { amount0: number; amount1: number; liquidity: number; split0: number; split1: number } => {
    const sqrtP = Math.sqrt(currentPrice);
    const sqrtPa = Math.sqrt(lowerPrice);
    const sqrtPb = Math.sqrt(upperPrice);

    let liquidity: number;

    if (currentPrice <= lowerPrice) {
        // Only Token 0
        liquidity = (depositValueUsdc / currentPrice) * (sqrtPa * sqrtPb) / (sqrtPb - sqrtPa);
    } else if (currentPrice >= upperPrice) {
        // Only Token 1
        liquidity = depositValueUsdc / (sqrtPb - sqrtPa);
    } else {
        // Mixed
        // totalValue = x * P + y
        // x = L * (sqrtPb - sqrtP) / (sqrtP * sqrtPb)
        // y = L * (sqrtP - sqrtPa)
        // x * P = L * (sqrtPb - sqrtP) * sqrtP / sqrtPb
        const multiplier = ((sqrtPb - sqrtP) * sqrtP / sqrtPb) + (sqrtP - sqrtPa);
        liquidity = depositValueUsdc / multiplier;
    }

    const amounts = getAmountsForLiquidity(sqrtP, sqrtPa, sqrtPb, liquidity);
    const value0 = amounts.amount0 * currentPrice;
    const value1 = amounts.amount1;
    const total = value0 + value1;

    return {
        ...amounts,
        split0: total > 0 ? (value0 / total) * 100 : 0,
        split1: total > 0 ? (value1 / total) * 100 : 0
    };
};

/**
 * Calculates token amounts for a given liquidity and price range.
 */
export const getAmountsForLiquidity = (
    sqrtP: number,
    sqrtPa: number,
    sqrtPb: number,
    liquidity: number
): { amount0: number; amount1: number; liquidity: number } => {
    let amount0 = 0;
    let amount1 = 0;

    if (sqrtP <= sqrtPa) {
        amount0 = liquidity * (sqrtPb - sqrtPa) / (sqrtPa * sqrtPb);
    } else if (sqrtP >= sqrtPb) {
        amount1 = liquidity * (sqrtPb - sqrtPa);
    } else {
        amount0 = liquidity * (sqrtPb - sqrtP) / (sqrtP * sqrtPb);
        amount1 = liquidity * (sqrtP - sqrtPa);
    }

    return { amount0, amount1, liquidity };
};

/**
 * Projects the value of a position at a target price.
 */
export const projectPositionValue = (
    targetPrice: number,
    lowerPrice: number,
    upperPrice: number,
    liquidity: number
): { value: number; amount0: number; amount1: number } => {
    const sqrtP = Math.sqrt(targetPrice);
    const sqrtPa = Math.sqrt(lowerPrice);
    const sqrtPb = Math.sqrt(upperPrice);

    const amounts = getAmountsForLiquidity(sqrtP, sqrtPa, sqrtPb, liquidity);
    const value = (amounts.amount0 * targetPrice) + amounts.amount1;

    return { ...amounts, value };
};

/**
 * Calculates Impermanent Loss % compared to holding initial amounts.
 */
export const calculateIL = (
    currentPrice: number,
    targetPrice: number,
    lowerPrice: number,
    upperPrice: number,
    depositValueUsdc: number
): { lpValue: number; heldValue: number; ilPercentage: number; ilUsdc: number } => {
    // 1. Get initial amounts
    const initial = calculateRequiredAmounts(currentPrice, lowerPrice, upperPrice, depositValueUsdc);

    // 2. Calculate held value at target price
    const heldValue = (initial.amount0 * targetPrice) + initial.amount1;

    // 3. Calculate LP value at target price
    const projection = projectPositionValue(targetPrice, lowerPrice, upperPrice, initial.liquidity);
    const lpValue = projection.value;

    const ilUsdc = lpValue - heldValue;
    const ilPercentage = heldValue > 0 ? (ilUsdc / heldValue) * 100 : 0;

    return { lpValue, heldValue, ilPercentage, ilUsdc };
};

/**
 * Finds the price required to achieve a target Token0 split percentage.
 * Uses binary search within the provided range.
 */
export const getPriceForTargetSplit = (
    targetSplit0: number,
    lowerPrice: number,
    upperPrice: number,
    precision: number = 20
): number => {
    let low = lowerPrice;
    let high = upperPrice;

    // Price -> Split0 is monotonic (decreasing)
    // P = lowerPrice -> Split0 = 100%
    // P = upperPrice -> Split0 = 0%

    for (let i = 0; i < precision; i++) {
        const mid = (low + high) / 2;
        const currentSplit = calculateRequiredAmounts(mid, lowerPrice, upperPrice, 1000).split0;

        if (currentSplit > targetSplit0) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return (low + high) / 2;
};

/**
 * Calculates the Delta (exposure to Token 0) of a concentrated liquidity position.
 * This represents how many units of Token 0 the position "effectively" owns.
 */
export const calculateDelta = (
    currentPrice: number,
    lowerPrice: number,
    upperPrice: number,
    liquidity: number
): number => {
    const sqrtP = Math.sqrt(currentPrice);
    const sqrtPa = Math.sqrt(lowerPrice);
    const sqrtPb = Math.sqrt(upperPrice);

    if (currentPrice <= lowerPrice) {
        // Entirely Token 0
        return liquidity * (sqrtPb - sqrtPa) / (sqrtPa * sqrtPb);
    } else if (currentPrice >= upperPrice) {
        // Entirely Token 1 (effectively 0 delta to Token 0)
        return 0;
    } else {
        // Partial exposure
        return liquidity * (sqrtPb - sqrtP) / (sqrtP * sqrtPb);
    }
};
