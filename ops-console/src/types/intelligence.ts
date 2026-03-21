export interface IntelRecord {
    symbol: string;
    verdict: string;
    rating: 'GOOD' | 'BAD' | 'RISKY' | 'STRONG BUY';
    signalStrength: number;
    signalType: string;
    narrative: string;
    catalysts: string[];
    risks: string[];
    updatedAt: number;
}
