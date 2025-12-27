import { Transaction } from '../types';

export interface JournalEntry {
    txId: string;
    date: string;
    txType: string;
    description: string;
    account: string;
    debit: number;
    credit: number;
    currency: string;
}

export const getJournalEntries = (transactions: Transaction[]): JournalEntry[] => {
    const entries: JournalEntry[] = [];

    // Sort transactions by date desc (most recent first for journal)
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(tx => {
        const date = tx.date;
        const txId = tx.id;
        const txType = tx.type;
        const description = tx.notes || `${tx.type} ${tx.assetSymbol}`;

        if (tx.type === 'DEPOSIT') {
            if (tx.paymentCurrency && tx.paymentAmount) {
                // Buy scenario: Debit Asset, Credit Payment Currency
                entries.push({
                    txId, date, txType, description: `Buy ${tx.assetSymbol} with ${tx.paymentCurrency}`,
                    account: tx.assetSymbol, debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol
                });
                entries.push({
                    txId, date, txType, description: `Payment for ${tx.assetSymbol}`,
                    account: tx.paymentCurrency, debit: 0, credit: Number(tx.paymentAmount) || 0, currency: tx.paymentCurrency
                });
            } else if (tx.notes && tx.notes.startsWith('Pool Creation:')) {
                // LP Pool Creation Logic
                // We typically receive a DEPOSIT of the LP Token (e.g. HYPE-ETH-LP)
                // The funding came from previous WITHDRAWALs (Assets) or Fresh Capital.

                // 1. Debit the LP Account (Asset Inflow)
                entries.push({
                    txId, date, txType, description: `Pool Creation`,
                    account: tx.assetSymbol, debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol
                });

                // 2. Identify Fresh Capital portion to Credit CAPITAL_FUNDING
                // The notes usually look like: "Pool Creation: 10 HYPE (Holdings) + $500 Fresh Capital"
                const freshMatch = tx.notes.match(/\$([\d,.]+) Fresh Capital/);
                if (freshMatch) {
                    const freshAmount = parseFloat(freshMatch[1].replace(/,/g, ''));
                    if (freshAmount > 0) {
                        entries.push({
                            txId, date, txType, description: 'Fresh Capital Injection',
                            account: 'CAPITAL_FUNDING', debit: 0, credit: freshAmount, currency: 'USD'
                        });
                    }
                }

                // Note: The "Asset" portion of funding is already accounted for by the WITHDRAWAL transactions
                // which will now point to this LP Account as a Debit (or simple outflow if we want to treat LP as separate).
                // Actually, standard double entry: 
                // Withdrawal from HYPE -> Debit LP_ACCOUNT, Credit HYPE.
                // Deposit LP Token -> Debit LP_ASSET, Credit LP_ACCOUNT (balancing logic).
                // For simplicity in this "T-Account View", we might just want to see the flow INTO the LP.

            } else {
                // External Deposit: Debit Asset, Credit External Funding
                entries.push({
                    txId, date, txType, description: `Deposit ${tx.assetSymbol}`,
                    account: tx.assetSymbol, debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol
                });
                entries.push({
                    txId, date, txType, description: 'External Inflow',
                    account: 'CAPITAL_FUNDING', debit: 0, credit: (Number(tx.amount) || 0) * (tx.pricePerUnit || 1), currency: 'USD'
                });
            }
        } else if (tx.type === 'INTEREST') {
            // Debit Asset, Credit Earnings
            entries.push({
                txId, date, txType, description: `${tx.interestType || 'Yield'} Reward`,
                account: tx.assetSymbol, debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol
            });
            entries.push({
                txId, date, txType, description: 'Staking/Yield Earnings',
                account: 'EARNED_REWARDS', debit: 0, credit: Number(tx.amount) || 0, currency: tx.assetSymbol
            });
        } else if (tx.type === 'WITHDRAWAL') {
            const lpMoveMatch = tx.notes ? tx.notes.match(/Moved to LP (.+)/) : null;

            if (lpMoveMatch) {
                const lpSymbol = lpMoveMatch[1];
                // LP Funding: Debit LP Account, Credit Spot Asset
                entries.push({
                    txId, date, txType, description: `Contribute to ${lpSymbol}`,
                    account: lpSymbol, debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol
                });
                entries.push({
                    txId, date, txType, description: `Transferred to LP`,
                    account: tx.assetSymbol, debit: 0, credit: Number(tx.amount) || 0, currency: tx.assetSymbol
                });
            } else {
                // Regular Withdrawal
                entries.push({
                    txId, date, txType, description: `Withdraw ${tx.assetSymbol}`,
                    account: 'EXTERNAL_OUTFLOW', debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol
                });
                entries.push({
                    txId, date, txType, description: `Reduction of spot ${tx.assetSymbol}`,
                    account: tx.assetSymbol, debit: 0, credit: Number(tx.amount) || 0, currency: tx.assetSymbol
                });
            }
        }

        // Handle Fees if present
        if (tx.fee && tx.fee > 0) {
            const feeCurrency = tx.feeCurrency || 'USD';
            entries.push({
                txId, date, txType: 'FEE', description: `Network/Platform Fee`,
                account: 'EXPENSE_FEES', debit: Number(tx.fee), credit: 0, currency: feeCurrency
            });
            entries.push({
                txId, date, txType: 'FEE', description: `Fee Payment`,
                account: feeCurrency, debit: 0, credit: Number(tx.fee), currency: feeCurrency
            });
        }
    });

    return entries;
};
