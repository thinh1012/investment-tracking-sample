/**
 * WALLET VIEW - Rabby Wallet Inspired
 * Full-screen, immersive wallet experience
 * No compromises, pure black aesthetic
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
    ArrowUpRight, 
    ArrowDownRight, 
    RefreshCw, 
    Plus, 
    Wallet,
    Home,
    Activity,
    PieChart,
    Settings,
    ChevronRight,
    Bell,
    Search,
    ScanLine,
    ArrowRightLeft,
    Send,
    Landmark
} from 'lucide-react';
import { Asset, Transaction } from '../../types';

// ============================================
// TYPES
// ============================================
interface WalletViewProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
    onAddClick: () => void;
    onRefreshPrices?: () => void;
    onBack?: () => void;
}

type Tab = 'tokens' | 'activity' | 'nft' | 'more';

// ============================================
// UTILITIES
// ============================================
const formatCurrency = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
};

const formatTokenAmount = (amount: number, decimals: number = 4): string => {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(2)}K`;
    if (amount < 0.0001) return `<0.0001`;
    return amount.toFixed(decimals);
};

// Chain colors for token badges
const CHAIN_COLORS: Record<string, string> = {
    'ETH': '#627EEA',
    'BTC': '#F7931A',
    'SOL': '#14F195',
    'USDC': '#2775CA',
    'USDT': '#26A17B',
    'HYPE': '#6B21A8',
    'SUI': '#4DA2FF',
    'BNB': '#F3BA2F',
    'ARB': '#28A0F0',
    'OP': '#FF0420',
    'MATIC': '#8247E5',
    'AVAX': '#E84142',
    'BASE': '#0052FF',
    'DAI': '#F5AC37',
    'LINK': '#2A5ADA',
};

const getTokenColor = (symbol: string): string => {
    return CHAIN_COLORS[symbol.toUpperCase()] || `hsl(${symbol.charCodeAt(0) * 20 % 360}, 70%, 50%)`;
};

// ============================================
// COMPONENTS
// ============================================

/**
 * Token Icon with Glow Effect
 */
const TokenIcon: React.FC<{ symbol: string; size?: number }> = ({ symbol, size = 44 }) => {
    const color = getTokenColor(symbol);
    const initial = symbol.charAt(0).toUpperCase();
    
    return (
        <div 
            className="relative flex items-center justify-center font-bold text-white"
            style={{ 
                width: size, 
                height: size, 
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                borderRadius: '50%',
                boxShadow: `0 4px 20px ${color}40`,
                fontSize: size * 0.4,
            }}
        >
            {initial}
        </div>
    );
};

/**
 * Balance Header - Large, centered, dramatic
 */
const BalanceHeader: React.FC<{ 
    totalValue: number; 
    totalInvested: number;
    isRefreshing: boolean;
    onRefresh: () => void;
}> = ({ totalValue, totalInvested, isRefreshing, onRefresh }) => {
    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
    const isProfit = pnl >= 0;

    return (
        <div className="px-6 pt-8 pb-6 text-center">
            {/* Total Balance Label */}
            <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-[#666666] text-sm font-medium tracking-wide">TOTAL BALANCE</span>
                <button 
                    onClick={onRefresh}
                    className={`p-1.5 rounded-full hover:bg-white/5 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={14} className="text-[#666666]" />
                </button>
            </div>
            
            {/* Large Balance */}
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                {formatCurrency(totalValue)}
            </h1>
            
            {/* PnL Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                isProfit 
                    ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' 
                    : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
            }`}>
                {isProfit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatCurrency(Math.abs(pnl))} ({Math.abs(pnlPercent).toFixed(2)}%)
            </div>
        </div>
    );
};

/**
 * Quick Action Buttons
 */
const QuickActions: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => {
    const actions = [
        { icon: Plus, label: 'Add', onClick: onAddClick, primary: true },
        { icon: ArrowRightLeft, label: 'Swap', onClick: () => {}, primary: false },
        { icon: Send, label: 'Send', onClick: () => {}, primary: false },
        { icon: Landmark, label: 'Earn', onClick: () => {}, primary: false },
    ];

    return (
        <div className="px-6 py-4">
            <div className="grid grid-cols-4 gap-3">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                            action.primary 
                                ? 'bg-[#7b3fe4] hover:bg-[#5a2db8] text-white shadow-lg shadow-[#7b3fe4]/25' 
                                : 'bg-[#1c1c1c] hover:bg-[#252525] text-white border border-[#2a2a2a]'
                        }`}
                    >
                        <action.icon size={20} />
                        <span className="text-xs font-medium">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

/**
 * Token Row - Clean, tappable, informative
 */
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
            className="flex items-center px-6 py-4 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer group"
        >
            {/* Token Icon */}
            <TokenIcon symbol={asset.symbol} size={48} />
            
            {/* Token Info */}
            <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-lg">{asset.symbol}</span>
                    <span className="text-[#666666] text-sm">{asset.symbol}</span>
                </div>
                <div className="text-[#888888] text-sm mt-0.5">
                    {formatTokenAmount(asset.quantity, 6)} {asset.symbol}
                </div>
            </div>
            
            {/* Value & PnL */}
            <div className="text-right">
                <div className="font-semibold text-white text-lg">
                    {formatCurrency(value)}
                </div>
                <div className={`text-sm mt-0.5 font-medium ${pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </div>
            </div>
            
            {/* Arrow */}
            <ChevronRight size={20} className="ml-3 text-[#444444] group-hover:text-[#7b3fe4] transition-colors" />
        </div>
    );
};

/**
 * Token List Section
 */
const TokenList: React.FC<{
    assets: Asset[];
    prices: Record<string, number>;
}> = ({ assets, prices }) => {
    // Sort by value descending
    const sortedAssets = useMemo(() => {
        return [...assets].sort((a, b) => {
            const valueA = a.quantity * (prices[a.symbol] || 0);
            const valueB = b.quantity * (prices[b.symbol] || 0);
            return valueB - valueA;
        });
    }, [assets, prices]);

    return (
        <div className="flex-1 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#2a2a2a]">
                <span className="text-[#888888] text-sm font-medium">Your Assets</span>
                <span className="text-[#666666] text-sm">{assets.length} tokens</span>
            </div>

            {/* List */}
            <div className="divide-y divide-[#2a2a2a]/50">
                {sortedAssets.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="w-20 h-20 bg-[#1c1c1c] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#2a2a2a]">
                            <Wallet size={32} className="text-[#666666]" />
                        </div>
                        <p className="text-[#888888] text-lg">No assets yet</p>
                        <p className="text-[#666666] text-sm mt-1">Add your first transaction to get started</p>
                    </div>
                ) : (
                    sortedAssets.map(asset => (
                        <TokenRow 
                            key={asset.symbol}
                            asset={asset}
                            price={prices[asset.symbol] || 0}
                            onClick={() => console.log('Token clicked:', asset.symbol)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

/**
 * Bottom Navigation
 */
const BottomNav: React.FC<{
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}> = ({ activeTab, onTabChange }) => {
    const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
        { id: 'tokens', icon: Home, label: 'Tokens' },
        { id: 'activity', icon: Activity, label: 'Activity' },
        { id: 'nft', icon: PieChart, label: 'NFTs' },
        { id: 'more', icon: Settings, label: 'More' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#2a2a2a] px-2 py-2 md:relative md:bg-transparent md:border-t-0 md:px-6 md:py-4">
            <div className="flex justify-around md:justify-start md:gap-8">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                                isActive 
                                    ? 'text-[#7b3fe4]' 
                                    : 'text-[#666666] hover:text-[#888888]'
                            }`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[11px] font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Top Navigation Bar
 */
const TopBar: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
    <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
            {onBack && (
                <button 
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <ArrowDownRight size={20} className="text-white rotate-90" />
                </button>
            )}
            <div className="w-8 h-8 bg-gradient-to-br from-[#7b3fe4] to-[#3b82f6] rounded-lg flex items-center justify-center">
                <Wallet size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">Wallet</span>
        </div>
        
        <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors">
                <Search size={20} className="text-[#888888]" />
            </button>
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors">
                <ScanLine size={20} className="text-[#888888]" />
            </button>
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors relative">
                <Bell size={20} className="text-[#888888]" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#7b3fe4] rounded-full" />
            </button>
        </div>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export const WalletView: React.FC<WalletViewProps> = ({
    assets = [],
    transactions = [],
    prices = {},
    onAddClick,
    onRefreshPrices,
    onBack
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('tokens');
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

    const handleRefresh = useCallback(async () => {
        if (!onRefreshPrices) return;
        setIsRefreshing(true);
        await onRefreshPrices();
        setTimeout(() => setIsRefreshing(false), 1000);
    }, [onRefreshPrices]);

    return (
        <div className="h-full flex flex-col bg-black text-white overflow-hidden">
            {/* Top Navigation */}
            <TopBar onBack={onBack} />
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto pb-20 md:pb-0">
                {/* Balance Header */}
                <BalanceHeader 
                    totalValue={totalValue}
                    totalInvested={totalInvested}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                />

                {/* Quick Actions */}
                <QuickActions onAddClick={onAddClick} />

                {/* Token List */}
                <TokenList assets={assets} prices={prices} />
            </div>
            
            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};

export default WalletView;
