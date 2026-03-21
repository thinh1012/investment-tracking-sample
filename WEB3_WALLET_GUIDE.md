# Web3 Wallet Integration Guide

## Overview
Digital HQ now supports Web3 wallet connections! Connect your MetaMask, Rabby, or any EIP-1193 compatible wallet to view your on-chain balances.

## Features

### ✅ Implemented
- **Wallet Connection** - Connect via MetaMask, Rabby, or other wallets
- **Balance Display** - View native token balance (ETH, BNB, MATIC, etc.)
- **Multi-Chain Support** - Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche, Linea
- **Network Switching** - Switch between chains directly from the UI
- **Address Display** - Formatted address with copy to clipboard
- **Explorer Links** - View address on block explorer
- **Disconnect** - Securely disconnect wallet

### 🔮 Coming Soon
- **Token Import** - Import ERC-20 token balances
- **Transaction History** - Fetch on-chain transaction history
- **Auto-Sync** - Automatically add discovered tokens to portfolio

## Supported Chains

| Chain ID | Network | Symbol |
|----------|---------|--------|
| 1 | Ethereum | ETH |
| 56 | BSC | BNB |
| 137 | Polygon | MATIC |
| 42161 | Arbitrum | ETH |
| 10 | Optimism | ETH |
| 8453 | Base | ETH |
| 43114 | Avalanche | AVAX |
| 59144 | Linea | ETH |

## How to Use

### 1. Connect Your Wallet
- Click the **"Connect"** button in the sidebar
- Or go to **Settings** → **Web3 Wallet** for full card view
- Select your wallet (MetaMask, Rabby, etc.)
- Approve the connection request

### 2. View Balance
- Your balance is displayed in the native token of the connected chain
- Click the refresh icon to update balance
- Balance shows 4 decimal places

### 3. Switch Networks
- In the card view (Settings), click the **Network** dropdown
- Select a different chain
- Your wallet will prompt to switch networks

### 4. Copy Address
- Click the copy icon next to your address
- Or click "Copy Address" from the dropdown menu

### 5. View on Explorer
- Click the external link icon
- Opens your address on the appropriate block explorer

### 6. Disconnect
- Click "Disconnect" in the card view or dropdown
- Clears connection state

## Technical Details

### Architecture
```
Web3Service (Singleton)
├── BrowserProvider (ethers v6)
├── Event Listeners (accountsChanged, chainChanged)
└── State Management

useWeb3 Hook
├── Reactive state subscription
├── Connection methods
└── Helper functions

UI Components
├── WalletConnect (button/card variants)
└── Chain selector
```

### Files Added
```
src/
├── services/web3/
│   └── Web3Service.ts      # Core Web3 logic
├── hooks/
│   └── useWeb3.ts          # React hook
├── components/web3/
│   ├── WalletConnect.tsx   # UI component
│   └── index.ts            # Exports
└── WEB3_WALLET_GUIDE.md    # This guide
```

### Dependencies
- `ethers` ^6.13.0 - Ethereum library

## Security Notes

⚠️ **Important:**
- This app **never** stores your private keys
- All connections are read-only (balance queries)
- Transaction signing requires explicit user approval
- Connection state is not persisted (refresh = reconnect)
- Uses standard EIP-1193 provider interface

## Troubleshooting

### "No wallet detected"
- Install MetaMask or Rabby Wallet browser extension
- Refresh the page after installation

### "Failed to connect"
- Make sure your wallet is unlocked
- Check if you're on the correct network
- Try refreshing the page

### "User rejected request"
- You clicked "Reject" in the wallet popup
- Click Connect again and approve

### Balance not updating
- Click the refresh icon
- Check your wallet's network connection
- Ensure you're on a supported chain

## Future Enhancements

- [ ] Token balance fetching (ERC-20)
- [ ] NFT portfolio view
- [ ] Transaction history import
- [ ] DeFi position tracking
- [ ] WalletConnect v2 support (mobile wallets)
- [ ] Hardware wallet support (Ledger, Trezor)

---

**Questions?** Check the console for detailed logs or refer to the Web3Service.ts implementation.
