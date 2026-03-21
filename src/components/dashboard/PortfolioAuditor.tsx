import React, { useMemo } from 'react';
import { Asset, Transaction } from '../../types';
import { TableShell } from '../common/TableShell';
import { Activity, AlertTriangle, CheckCircle, Info, Calculator, ExternalLink } from 'lucide-react';

interface PortfolioAuditorProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
    locale?: string;
    onClose?: () => void;
}

export const PortfolioAuditor: React.FC<PortfolioAuditorProps> = ({
    assets,
    transactions,
    prices,
    locale = 'en-US',
    onClose
}) => {
    const auditData = useMemo(() => {
        return assets.map(asset => {
            const assetTxs = transactions.filter(t => t.assetSymbol.toUpperCase() === asset.symbol.toUpperCase());
            const totalDeposited = assetTxs
                .filter(t => t.type === 'DEPOSIT' || t.type === 'BUY')
                .reduce((sum, t) => sum + (t.paymentAmount || (t.amount * (t.pricePerUnit || 0))), 0);

            const isFaultyPrice = asset.currentPrice === 404;
            const hasNoTransactions = assetTxs.length === 0;
            const suspiciousBalance = asset.quantity > 0 && hasNoTransactions;

            return {
                ...asset,
                txCount: assetTxs.length,
                totalDeposited,
                isFaultyPrice,
                hasNoTransactions,
                suspiciousBalance
            };
        }).sort((a, b) => b.currentValue - a.currentValue);
    }, [assets, transactions, prices]);

    const totalPortfolioValue = auditData.reduce((sum, a) => sum + a.currentValue, 0);

    return (
        <TableShell
            title="Portfolio Auditor"
            subtitle="Transparent validation of your valuation"
            icon={<Calculator />}
            iconColor="indigo"
            isOpen={true}
            onToggle={onClose || (() => { })}
            className="mb-10"
        >
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reported Value</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">
                            ${totalPortfolioValue.toLocaleString(locale, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                    <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Faulty Prices Detected</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {auditData.filter(a => a.isFaultyPrice).length}
                        </p>
                    </div>
                    <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Phantom Assets</p>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                            {auditData.filter(a => a.suspiciousBalance).length}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto text-xs md:text-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-4 py-3">Asset</th>
                                <th className="px-4 py-3">Quantity</th>
                                <th className="px-4 py-3">Unit Price</th>
                                <th className="px-4 py-3 text-right">Total Value</th>
                                <th className="px-4 py-3">TXs</th>
                                <th className="px-4 py-3">Source</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditData.map((asset) => (
                                <tr key={asset.symbol} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-4 py-4 font-black">{asset.symbol}</td>
                                    <td className="px-4 py-4 font-mono text-slate-500">{asset.quantity.toLocaleString(locale, { maximumFractionDigits: 4 })}</td>
                                    <td className="px-4 py-4 font-mono">
                                        <span className={asset.isFaultyPrice ? 'text-rose-500 font-black flex items-center gap-1' : ''}>
                                            ${asset.currentPrice.toLocaleString(locale, { maximumFractionDigits: 2 })}
                                            {asset.isFaultyPrice && <AlertTriangle size={12} />}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 font-black text-right">${asset.currentValue.toLocaleString(locale, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-4 font-mono text-slate-400">{asset.txCount}</td>
                                    <td className="px-4 py-4 uppercase text-[9px] font-black tracking-tighter text-slate-400">
                                        {asset.valuationSource || 'SATELLITE'}
                                    </td>
                                    <td className="px-4 py-4">
                                        {asset.isFaultyPrice ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-bold">
                                                <AlertTriangle size={10} /> FAULTY_PRICE
                                            </span>
                                        ) : asset.suspiciousBalance ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-bold">
                                                <Activity size={10} /> PHANTOM_ASSET
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                                                <CheckCircle size={10} /> VERIFIED
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-xs text-slate-500 flex gap-4 items-start">
                    <Info className="text-indigo-500 shrink-0" size={16} />
                    <div>
                        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Analyst Note:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Assets marked as <strong>FAULTY_PRICE</strong> were errors in the database. The app now automatically ignores these and falls back to <strong>historical data</strong> or <strong>cost basis</strong>.</li>
                            <li>Assets marked as <strong>PHANTOM_ASSET</strong> have a balance but no recorded transactions in your ledger.</li>
                            <li>The app now <strong>retries synchronization</strong> every 10 seconds if an error occurs, ensuring the next valid price is captured as soon as possible.</li>
                            <li>The audit tool cross-references your <strong>{transactions.length} transactions</strong> against the last valid marked prices.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </TableShell>
    );
};
