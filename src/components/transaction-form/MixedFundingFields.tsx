import React from 'react';
import { Asset } from '../../types';

interface MixedFundingFieldsProps {
    mixedCashSymbol: string;
    setMixedCashSymbol: (s: string) => void;
    mixedCashAmount: string;
    setMixedCashAmount: (s: string) => void;
    mixedAssetSymbol: string;
    setMixedAssetSymbol: (s: string) => void;
    mixedAssetQty: string;
    setMixedAssetQty: (s: string) => void;
    assets: Asset[];
}

export const MixedFundingFields: React.FC<MixedFundingFieldsProps> = (props) => {
    const {
        mixedCashSymbol, setMixedCashSymbol, mixedCashAmount, setMixedCashAmount,
        mixedAssetSymbol, setMixedAssetSymbol, mixedAssetQty, setMixedAssetQty,
        assets
    } = props;

    return (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-500">Mixed Funding Sources</div>

            {/* Cash Part */}
            <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold">1. Fresh Token (Capital)</label>
                <div className="flex gap-2">
                    <select
                        className="w-1/3 rounded-lg border-slate-200 dark:border-slate-700 text-xs font-bold uppercase dark:bg-slate-800 dark:text-white px-1"
                        value={mixedCashSymbol}
                        onChange={e => setMixedCashSymbol(e.target.value)}
                    >
                        <option value="USDT">USDT</option>
                        <option value="USDC">USDC</option>
                        <option value="USD">USD</option>
                        <option value="DAI">DAI</option>
                        <option value="ETH">ETH</option>
                        <option value="BTC">BTC</option>
                    </select>
                    <input
                        type="number"
                        step="any"
                        placeholder="Amount"
                        value={mixedCashAmount}
                        onChange={e => setMixedCashAmount(e.target.value)}
                        className="w-2/3 rounded-lg border-slate-200 dark:border-slate-700 text-sm px-2 py-1.5 dark:bg-slate-800 dark:text-white"
                    />
                </div>
            </div>

            {/* Asset Part */}
            <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold">2. Existing Asset</label>
                <div className="flex gap-2">
                    <select
                        className="w-1/3 rounded-lg border-slate-200 dark:border-slate-700 text-xs font-bold uppercase dark:bg-slate-800 dark:text-white px-1"
                        value={mixedAssetSymbol}
                        onChange={e => setMixedAssetSymbol(e.target.value)}
                    >
                        <option value="">-- Asset --</option>
                        {assets.filter(a => !a.lpRange).map(a => (
                            <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        step="any"
                        placeholder="Qty"
                        value={mixedAssetQty}
                        onChange={e => setMixedAssetQty(e.target.value)}
                        className="w-2/3 rounded-lg border-slate-200 dark:border-slate-700 text-sm px-2 py-1.5 dark:bg-slate-800 dark:text-white"
                    />
                </div>
            </div>

            <div className="text-xs text-right text-indigo-500 pt-1">
                Total Cost Basis will be sum of both.
            </div>
        </div>
    );
};
