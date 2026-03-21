import React, { useState, useMemo } from 'react';
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownRight, 
    RefreshCw, 
    Plus, 
    Settings,
    TrendingUp,
    PieChart,
    Activity,
    ChevronRight
} from 'lucide-react';
import { Asset, Transaction } from '../../types';

// ============================================
// Rabby Wallet Inspired Dashboard
// Clean, dark-first, token-list focused design
// ============================================

interface RabbyDashboardProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
    onAddClick: () => void;
    onRefreshPrices?: () => void;
}

// Format currency with Rabby style
const formatCurrency = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
};

const formatTokenAmount = (amount: number, symbol: string): string => {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)}B ${symbol}`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M ${symbol}`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(2)}K ${symbol}`;
    return `${amount.toFixed(amount < 1 ? 4 : 2)} ${symbol}`;
};

// Chain badge colors (simplified)
const getChainColor = (symbol: string): string => {
    const chainColors: Record<string, string> = {
        'ETH': '#627EEA',
        'BTC': '#F7931A',
        'SOL': '#14F195',
        'USDC': '#2775CA',
        'USDT': '#26A17B',
        'HYPE': '#6B21A8',
        'SUI': '#4DA2FF',
    };
    return chainColors[symbol] || '#7b3fe4';
};

// Token Icon Component
const TokenIcon: React.FC<{ symbol: string; size?: number }> = ({ symbol, size = 40 }) => {
    const color = getChainColor(symbol);
    const initial = symbol.charAt(0).toUpperCase();
    
    return (
        <div 
            className="relative flex items-center justify-center font-bold text-white text-sm"
            style={{ 
                width: size, 
                height: size, 
                backgroundColor: color,
                borderRadius: '50%',
                boxShadow: `0 0 12px ${color}40`
            }}
        >
            {initial}
        </div>
    );
};

// Total Balance Header (Rabby style)
const BalanceHeader: React.FC<{ 
    totalValue: number; 
    totalInvested: number;
    onRefresh: () => void;
    isRefreshing: boolean;
}> = ({ totalValue, totalInvested, onRefresh, isRefreshing }) => {
    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
    const isProfit = pnl >= 0;

    return (
        <div className="px-6 py-8 text-center">
            <p className="text-[#a0a0a0] text-sm mb-2">Total Balance</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                {formatCurrency(totalValue)}
            </h1>
            <div className={`flex items-center justify-center gap-2 text-sm ${isProfit ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                <span className="flex items-center gap-1">
                    {isProfit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {formatCurrency(Math.abs(pnl))} ({Math.abs(pnlPercent).toFixed(2)}%)
                </span>
                <span className="text-[#666666]">· 24h</span>
            </div>
        </div>
    );
};

// Token List Item (Rabby style)
const TokenRow: React.FC<{ 
    asset: Asset; 
    price: number;
    onClick: () => void;
}> = ({ asset, price, onClick }) => {
    const value = asset.quantity * price;
    const avgPrice = asset.averageBuyPrice || 0;
    const costBasis = asset.quantity * avgPrice;
    const pnl = value - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    return (
        <div 
            onClick={onClick}
            className="flex items-center px-6 py-4 hover:bg-[#252525] transition-colors cursor-pointer group"
        >
            {/* Token Icon */}
            <TokenIcon symbol={asset.symbol} size={44} />
            
            {/* Token Info */}
            <div className="ml-4 flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{asset.symbol}</span>
                    <span className="text-[#666666] text-xs">{asset.symbol}</span>
                </div>
                <div className="text-[#a0a0a0] text-sm mt-0.5">
                    {formatTokenAmount(asset.quantity, asset.symbol)}
                </div>
            </div>
            
            {/* Value & PnL */}
            <div className="text-right">
                <div className="font-semibold text-white">
                    {formatCurrency(value)}
                </div>
                <div className={`text-sm mt-0.5 ${pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </div>
            </div>
            
            {/* Arrow */}
            <ChevronRight size={20} className="ml-3 text-[#444444] group-hover:text-[#7b3fe4] transition-colors" />
        </div>
    );
};

// Quick Action Buttons
const QuickActions: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => (
    <div className="flex gap-3 px-6 py-4">
        <button 
            onClick={onAddClick}
            className="flex-1 bg-[#7b3fe4] hover:bg-[#5a2db8] text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: '0 0 20px rgba(123, 63, 228, 0.2)' }}
        >
            <Plus size={18} />
            Add Asset
        </button>
        <button className="px-4 py-3 bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-xl text-white transition-all">
            <Settings size={18} />
        </button>
    </div>
);

// Bottom Navigation (Rabby mobile-style)
const BottomNav: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({ 
    activeTab, 
    onTabChange 
}) => {
    const tabs = [
        { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
        { id: 'activity', icon: Activity, label: 'Activity' },
        { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
        { id: 'more', icon: PieChart, label: 'More' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#2a2a2a] px-6 py-3 md:hidden">
            <div className="flex justify-around">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center gap-1 transition-colors ${
                                isActive ? 'text-[#7b3fe4]' : 'text-[#666666]'
                            }`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// Main Dashboard Component
export const RabbyDashboard: React.FC<RabbyDashboardProps> = ({
    assets = [],
    transactions = [],
    prices = {},
    onAddClick,
    onRefreshPrices
}) => {
    const [activeTab, setActiveTab] = useState('portfolio');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Calculate totals
    const { totalValue, totalInvested } = useMemo(() => {
        const value = assets.reduce((sum, asset) => {
            const price = prices[asset.symbol] || 0;
            return sum + (asset.quantity * price);
        }, 0);
        
        const invested = assets.reduce((sum, asset) => {
            const avgPrice = asset.averageBuyPrice || 0;
            return sum + (asset.quantity * avgPrice);
        }, 0);
        
        return { totalValue: value, totalInvested: invested };
    }, [assets, prices]);

    const handleRefresh = async () => {
        if (!onRefreshPrices) return;
        setIsRefreshing(true);
        await onRefreshPrices();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // Sort assets by value
    const sortedAssets = useMemo(() => {
        return [...assets].sort((a, b) => {
            const valueA = a.quantity * (prices[a.symbol] || 0);
            const valueB = b.quantity * (prices[b.symbol] || 0);
            return valueB - valueA;
        });
    }, [assets, prices]);

    return (
        <div className="h-full bg-black text-white pb-24 md:pb-0 overflow-auto rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#7b3fe4] to-[#3b82f6] rounded-lg flex items-center justify-center">
                        <Wallet size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-lg">Digital HQ</span>
                </div>
                <button 
                    onClick={handleRefresh}
                    className={`p-2 hover:bg-[#252525] rounded-lg transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={20} className="text-[#a0a0a0]" />
                </button>
            </div>

            {/* Balance Header */}
            <BalanceHeader 
                totalValue={totalValue}
                totalInvested={totalInvested}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            {/* Quick Actions */}
            <QuickActions onAddClick={onAddClick} />

            {/* Token List Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm font-medium text-[#a0a0a0]">Your Assets</span>
                <span className="text-sm text-[#666666]">{assets.length} tokens</span>
            </div>

            {/* Token List */}
            <div className="divide-y divide-[#2a2a2a]">
                {sortedAssets.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-[#1c1c1c] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet size={24} className="text-[#666666]" />
                        </div>
                        <p className="text-[#a0a0a0]">No assets yet</p>
                        <p className="text-[#666666] text-sm mt-1">Add your first transaction to get started</p>
                    </div>
                ) : (
                    sortedAssets.map(asset => (
                        <TokenRow 
                            key={asset.symbol}
                            asset={asset}
                            price={prices[asset.symbol] || 0}
                            onClick={() => {}}
                        />
                    ))
                )}
            </div>

            {/* Bottom Navigation (Mobile) */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};

export default RabbyDashboard;
