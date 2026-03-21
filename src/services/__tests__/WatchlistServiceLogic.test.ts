import { describe, it, expect } from 'vitest';
import { WatchlistServiceLogic } from '../WatchlistServiceLogic';

describe('WatchlistServiceLogic', () => {
    describe('getRecommendation', () => {
        it('should return null if price is 0', () => {
            expect(WatchlistServiceLogic.getRecommendation(0, 100, 200)).toBeNull();
        });

        it('should recommend BUY if current price is below or equal to buy target', () => {
            const result = WatchlistServiceLogic.getRecommendation(90, 100, 200);
            expect(result?.type).toBe('BUY');
            expect(result?.color).toContain('emerald');

            const boundary = WatchlistServiceLogic.getRecommendation(100, 100, 200);
            expect(boundary?.type).toBe('BUY');
        });

        it('should recommend SELL if current price is above or equal to sell target', () => {
            const result = WatchlistServiceLogic.getRecommendation(210, 100, 200);
            expect(result?.type).toBe('SELL');
            expect(result?.color).toContain('rose');

            const boundary = WatchlistServiceLogic.getRecommendation(200, 100, 200);
            expect(boundary?.type).toBe('SELL');
        });

        it('should recommend WAIT if price is between targets', () => {
            const result = WatchlistServiceLogic.getRecommendation(150, 100, 200);
            expect(result?.type).toBe('WAIT');
            expect(result?.color).toContain('slate');
        });

        it('should return null if no targets are set', () => {
            expect(WatchlistServiceLogic.getRecommendation(150)).toBeNull();
        });
    });

    describe('calculateProgress', () => {
        it('should return 0 progress if target is 0', () => {
            const result = WatchlistServiceLogic.calculateProgress(10, 0);
            expect(result.percent).toBe(0);
            expect(result.isComplete).toBe(false);
        });

        it('should calculate correct percentage', () => {
            const result = WatchlistServiceLogic.calculateProgress(5, 10);
            expect(result.percent).toBe(50);
            expect(result.isComplete).toBe(false);
        });

        it('should cap progress at 100%', () => {
            const result = WatchlistServiceLogic.calculateProgress(15, 10);
            expect(result.percent).toBe(100);
            expect(result.isComplete).toBe(true);
        });

        it('should mark as complete when target reached', () => {
            const result = WatchlistServiceLogic.calculateProgress(10, 10);
            expect(result.percent).toBe(100);
            expect(result.isComplete).toBe(true);
        });
    });
});
