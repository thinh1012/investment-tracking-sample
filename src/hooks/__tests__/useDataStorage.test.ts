import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDataStorage } from '../useDataStorage';

describe('useDataStorage', () => {
    let mockNotify: any;
    let mockImportTransactions: any;

    beforeEach(() => {
        mockNotify = { success: vi.fn(), error: vi.fn() };
        mockImportTransactions = vi.fn();
        // Clear localStorage mock
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(),
            setItem: vi.fn(),
        });
    });

    describe('sanitizeData', () => {
        it('should correctly sanitize US formatted numbers', () => {
            (localStorage.getItem as any).mockReturnValue('en-US');
            const { sanitizeData } = useDataStorage([], mockImportTransactions, mockNotify);

            const input = [
                { id: '1', amount: '1,000.50', pricePerUnit: '1,000' }
            ];
            const output = sanitizeData(input);

            expect(output[0].amount).toBe(1000.50);
            expect(output[0].pricePerUnit).toBe(1000);
        });

        it('should correctly sanitize VN/EU formatted numbers', () => {
            (localStorage.getItem as any).mockReturnValue('vi-VN');
            const { sanitizeData } = useDataStorage([], mockImportTransactions, mockNotify);

            const input = [
                { id: '1', amount: '1.000,50', pricePerUnit: '21,5' }
            ];
            const output = sanitizeData(input);

            expect(output[0].amount).toBe(1000.50);
            expect(output[0].pricePerUnit).toBe(21.5);
        });

        it('should not affect already numeric values', () => {
            (localStorage.getItem as any).mockReturnValue('en-US');
            const { sanitizeData } = useDataStorage([], mockImportTransactions, mockNotify);

            const input = [
                { id: '1', amount: 500.25 }
            ];
            const output = sanitizeData(input);

            expect(output[0].amount).toBe(500.25);
        });
    });
});
