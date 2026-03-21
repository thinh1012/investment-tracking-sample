import React from 'react';
import { ChevronDown } from 'lucide-react';
import { InterestType, Asset, TransactionType } from '../../types';

interface AdditionalFieldsProps {
    type: TransactionType;
    interestType: InterestType;
    setInterestType: (t: InterestType) => void;
    platform: string;
    setPlatform: (s: string) => void;
    source: string;
    setSource: (s: string) => void;
    relatedAssetSymbol: string;
    relatedAssetSymbols: string[];
    setRelatedAssetSymbols: (s: string[]) => void;
    assets: Asset[];
    // SELL transaction fields
    paymentCurrency?: string;
    setPaymentCurrency?: (s: string) => void;
    receivedAmount?: string;
    setReceivedAmount?: (s: string) => void;
}

export const AdditionalFields: React.FC<AdditionalFieldsProps> = (props) => {
    const {
        type, interestType, setInterestType, platform, setPlatform,
        source, setSource, relatedAssetSymbol, relatedAssetSymbols,
        setRelatedAssetSymbols, assets,
        paymentCurrency, setPaymentCurrency, receivedAmount, setReceivedAmount
    } = props;

    if (type === 'INTEREST') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Interest Type</label>
                    <select
                        value={interestType}
                        onChange={(e) => setInterestType(e.target.value as InterestType)}
                        className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white"
                    >
                        <option value="STAKING">Staking</option>
                        <option value="SAVINGS">Savings</option>
                        <option value="FARMING">Farming</option>
                        <option value="LENDING">Lending</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Platform</label>
                    <input
                        type="text"
                        placeholder="e.g. Binance"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Source LPs / Assets (Optional)</label>
                    <div className="relative group">
                        <div
                            className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white min-h-[46px] cursor-pointer"
                            onClick={() => document.getElementById('source-dropdown')?.classList.toggle('hidden')}
                        >
                            {relatedAssetSymbols && relatedAssetSymbols.length > 0
                                ? relatedAssetSymbols.join(', ')
                                : <span className="text-slate-400">-- Select Liquidity Pools / Source Assets --</span>
                            }
                            <div className="absolute right-4 top-4 pointer-events-none">
                                <ChevronDown size={16} className="text-slate-400" />
                            </div>
                        </div>
                        <div id="source-dropdown" className="hidden absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {assets.filter(a =>
                                a.lpRange ||
                                a.symbol.toUpperCase().startsWith('LP') ||
                                a.symbol.includes('/') ||
                                a.symbol.includes('-') ||
                                a.symbol.toUpperCase().includes('POOL') ||
                                a.symbol.toUpperCase().includes('SWAP')
                            ).map(a => (
                                <div
                                    key={a.symbol}
                                    className="flex items-center px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                                    onClick={() => {
                                        const current = new Set(relatedAssetSymbols || []);
                                        if (current.has(a.symbol)) {
                                            current.delete(a.symbol);
                                        } else {
                                            current.add(a.symbol);
                                        }
                                        setRelatedAssetSymbols(Array.from(current));
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={relatedAssetSymbols?.includes(a.symbol) || false}
                                        readOnly
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">
                                        {a.symbol} {a.lpRange ? <span className="text-xs text-slate-400 ml-1">(Range: {a.lpRange.min}-{a.lpRange.max})</span> : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'TRANSFER') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">From (Source)</label>
                    <input
                        type="text"
                        placeholder="e.g. Wallet"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">To (Destination)</label>
                    <input
                        type="text"
                        placeholder="e.g. Aave Pool"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white"
                    />
                </div>
            </div>
        );
    }

    // SELL transaction - show received currency and amount
    // Note: UI "Sell" button uses WITHDRAWAL type internally
    if ((type === 'SELL' || type === 'WITHDRAWAL') && setPaymentCurrency && setReceivedAmount) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30 animate-in fade-in slide-in-from-top-2">
                <div>
                    <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">💰 Received Currency</label>
                    <select
                        value={paymentCurrency || 'USDT'}
                        onChange={(e) => setPaymentCurrency(e.target.value)}
                        className="block w-full rounded-xl border-emerald-200 dark:border-emerald-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white"
                    >
                        <option value="USDT">USDT</option>
                        <option value="USDC">USDC</option>
                        <option value="USD">USD (Fiat)</option>
                        <option value="DAI">DAI</option>
                        <option value="BUSD">BUSD</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">💵 Amount Received</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="e.g. 500.00"
                        value={receivedAmount || ''}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        className="block w-full rounded-xl border-emerald-200 dark:border-emerald-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white"
                    />
                </div>
                <div className="md:col-span-2">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        💡 This will automatically credit your {paymentCurrency || 'USDT'} balance
                    </p>
                </div>
            </div>
        );
    }

    return null;
};
