export type RecommendationType = 'BUY' | 'SELL' | 'WAIT';

export interface Recommendation {
    type: RecommendationType;
    color: string;
}

export const WatchlistServiceLogic = {
    /**
     * Determines the recommendation based on current price and targets.
     */
    getRecommendation(currentPrice: number, buyTarget?: number, sellTarget?: number): Recommendation | null {
        if (currentPrice <= 0) return null;

        if (buyTarget && currentPrice <= buyTarget) {
            return { type: 'BUY', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' };
        }

        if (sellTarget && currentPrice >= sellTarget) {
            return { type: 'SELL', color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' };
        }

        if (buyTarget || sellTarget) {
            return { type: 'WAIT', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
        }

        return null;
    },

    /**
     * Calculates the progress towards an accumulation goal.
     */
    calculateProgress(heldQuantity: number, expectedQty: number): { percent: number; isComplete: boolean } {
        if (!expectedQty || expectedQty <= 0) return { percent: 0, isComplete: false };

        const percent = Math.min((heldQuantity / expectedQty) * 100, 100);
        return {
            percent,
            isComplete: percent >= 100
        };
    }
};
