import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw, Eye, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useWatchAddresses } from '../../hooks/useWatchAddresses';

export const WatchAddressManager: React.FC = () => {
  const { addresses, isLoading, addAddress, removeAddress, refreshAddress, refreshAll, formatAddress, count, SUPPORTED_CHAINS } = useWatchAddresses();
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [selectedChain, setSelectedChain] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newAddress.trim()) { setError('Please enter an address'); return; }
    const result = await addAddress(newAddress.trim(), newLabel.trim(), selectedChain);
    if (result) { setSuccess('Address added!'); setNewAddress(''); setNewLabel(''); setTimeout(() => setSuccess(null), 3000); }
    else { setError('Invalid address or already exists'); }
  };

  const getExplorerUrl = (address: string, chainType: 'evm' | 'solana', chainId: number) => {
    if (chainType === 'solana') {
      return 'https://solscan.io/account/' + address;
    }
    const explorers: Record<number, string> = { 1: 'https://etherscan.io', 56: 'https://bscscan.com', 137: 'https://polygonscan.com', 42161: 'https://arbiscan.io', 10: 'https://optimistic.etherscan.io', 8453: 'https://basescan.org', 43114: 'https://snowtrace.io' };
    return (explorers[chainId] || explorers[1]) + '/address/' + address;
  };

  const getChainInfo = (chainId: number, chainType: 'evm' | 'solana') => {
    if (chainType === 'solana') return { name: 'Solana', symbol: 'SOL' };
    const chain = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];
    return chain || { name: 'Unknown', symbol: 'ETH' };
  };

  const formatBalance = (balance: string, chainType: 'evm' | 'solana'): string => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0.0000';
    
    // Show more decimals for small balances
    if (num === 0) return '0.0000';
    if (num < 0.0001) return num.toExponential(4);
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toFixed(2);
  };

  return (
    <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#7b3fe4] to-[#3b82f6] rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Watched Wallets</h3>
            <p className="text-sm text-[#888888]">{count} address{count !== 1 ? 'es' : ''}</p>
          </div>
        </div>
        {count > 0 && <button onClick={refreshAll} disabled={isLoading} className="p-2 hover:bg-white/5 rounded-lg"><RefreshCw className={`w-5 h-5 text-[#888888] ${isLoading ? 'animate-spin' : ''}`} /></button>}
      </div>

      <form onSubmit={handleAdd} className="mb-6 space-y-3">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newAddress} 
            onChange={(e) => setNewAddress(e.target.value)} 
            placeholder="Paste wallet address (0x... or Solana)" 
            className="flex-1 bg-[#252525] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-[#666666] focus:outline-none focus:border-[#7b3fe4] font-mono text-sm" 
          />
          <input 
            type="text" 
            value={newLabel} 
            onChange={(e) => setNewLabel(e.target.value)} 
            placeholder="Label (optional)" 
            className="w-40 bg-[#252525] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-[#666666] focus:outline-none focus:border-[#7b3fe4] text-sm" 
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedChain} 
            onChange={(e) => setSelectedChain(Number(e.target.value))} 
            className="bg-[#252525] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7b3fe4]"
          >
            {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => (
              <option key={id} value={id}>{chain.name}</option>
            ))}
          </select>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="flex-1 bg-[#7b3fe4] hover:bg-[#5a2db8] text-white font-medium px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 
            Add Address
          </button>
        </div>
        {error && <div className="flex items-center gap-2 text-[#ef4444] text-sm p-3 bg-[#ef4444]/10 rounded-lg"><AlertCircle className="w-4 h-4" />{error}</div>}
        {success && <div className="text-[#22c55e] text-sm p-3 bg-[#22c55e]/10 rounded-lg">{success}</div>}
      </form>

      <div className="space-y-2">
        {addresses.length === 0 ? (
          <div className="text-center py-8 text-[#666666]">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No watched addresses yet</p>
            <p className="text-sm mt-1">Add any ETH (0x...) or Solana address</p>
          </div>
        ) : addresses.map((addr) => {
          const chainInfo = getChainInfo(addr.chainId, addr.chainType);
          return (
            <div 
              key={addr.id} 
              className="flex items-center gap-3 p-3 bg-[#252525] rounded-lg group hover:bg-[#2a2a2a] transition-colors"
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  addr.chainType === 'solana' 
                    ? 'bg-[#9945FF]/20 text-[#9945FF]' 
                    : 'bg-[#7b3fe4]/20 text-[#7b3fe4]'
                }`}
              >
                {chainInfo.symbol.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white text-sm">{formatAddress(addr.address, 6)}</span>
                  {addr.label && <span className="text-[#888888] text-xs">- {addr.label}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#888888] text-xs">{chainInfo.name}</span>
                  {addr.isLoading ? (
                    <Loader2 className="w-3 h-3 text-[#666666] animate-spin" />
                  ) : (
                    <span className="text-[#22c55e] font-medium">
                      {formatBalance(addr.balance, addr.chainType)} {chainInfo.symbol}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => refreshAddress(addr.id)} 
                  className="p-2 hover:bg-white/5 rounded-lg"
                  title="Refresh balance"
                >
                  <RefreshCw className={`w-4 h-4 text-[#888888] ${addr.isLoading ? 'animate-spin' : ''}`} />
                </button>
                <a 
                  href={getExplorerUrl(addr.address, addr.chainType, addr.chainId)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 hover:bg-white/5 rounded-lg"
                  title="View on explorer"
                >
                  <ExternalLink className="w-4 h-4 text-[#888888]" />
                </a>
                <button 
                  onClick={() => removeAddress(addr.id)} 
                  className="p-2 hover:bg-[#ef4444]/10 rounded-lg"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4 text-[#ef4444]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WatchAddressManager;
