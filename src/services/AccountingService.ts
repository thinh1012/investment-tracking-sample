import { Transaction } from '../types';

export type AccountType = 'ASSET' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export const getAccountType = (accountName: string): AccountType => {
    const name = accountName.toUpperCase().trim();
    if (['CAPITAL_FUNDING', 'EXTERNAL_OUTFLOW'].includes(name)) return 'EQUITY';
    if (['EARNED_REWARDS'].includes(name)) return 'REVENUE';
    if (['EXPENSE_FEES'].includes(name)) return 'EXPENSE';
    return 'ASSET';
};

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
            const isPoolCreation = tx.notes && tx.notes.startsWith('Pool Creation:');
            const isInternalBuy = (tx.paymentCurrency && (tx.paymentAmount || (tx.notes && tx.notes.includes('(Holdings)'))));

            if (isInternalBuy) {
                // Buy scenario: Debit Asset, Credit Payment Currency
                const payAmount = Number(tx.paymentAmount) || (tx.notes ? parseFloat(tx.notes.match(/Funded with ([\d.]+) /)?.[1] || '0') : 0) || (Number(tx.amount) * (tx.pricePerUnit || 0));

                entries.push({
                    txId, date, txType, description: `Buy ${tx.assetSymbol}`,
                    account: tx.assetSymbol || 'UNKNOWN', debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol || 'UNKNOWN'
                });
                entries.push({
                    txId, date, txType, description: `Payment for ${tx.assetSymbol}`,
                    account: tx.paymentCurrency || 'USD', debit: 0, credit: payAmount, currency: tx.paymentCurrency || 'USD'
                });
            } else if (isPoolCreation) {
                // LP Pool Creation Logic
                // We typically receive a DEPOSIT of the LP Token (e.g. HYPE-ETH-LP)
                // The funding came from previous WITHDRAWALs (Assets) or Fresh Capital.

                // 1. Debit the LP Account (Asset Inflow)
                entries.push({
                    txId, date, txType, description: `Pool Creation`,
                    account: tx.assetSymbol || 'LP', debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol || 'LP'
                });

                // 2. Identify Fresh Capital portion to Credit CAPITAL_FUNDING
                const freshMatch = tx.notes ? tx.notes.match(/\$([\d,.]+) Fresh Capital/) : null;
                if (freshMatch) {
                    const freshAmount = parseFloat(freshMatch[1].replace(/,/g, ''));
                    if (freshAmount > 0) {
                        entries.push({
                            txId, date, txType, description: 'Fresh Capital Injection',
                            account: 'CAPITAL_FUNDING', debit: 0, credit: freshAmount, currency: 'USD'
                        });
                    }
                }
            } else {
                // External Deposit: Debit Asset, Credit External Funding
                entries.push({
                    txId, date, txType, description: `Deposit ${tx.assetSymbol}`,
                    account: tx.assetSymbol || 'ASSET', debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol || 'ASSET'
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
                account: tx.assetSymbol || 'ASSET', debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol || 'ASSET'
            });
            entries.push({
                txId, date, txType, description: 'Staking/Yield Earnings',
                account: 'EARNED_REWARDS', debit: 0, credit: Number(tx.amount) || 0, currency: tx.assetSymbol || 'ASSET'
            });
        } else if (tx.type === 'WITHDRAWAL') {
            const lpMoveMatch = tx.notes ? tx.notes.match(/Moved to LP (.+)/) : null;
            const isSwap = tx.notes && (tx.notes.includes('Used to buy') || tx.notes.includes('Swap') || tx.notes.includes('Bought'));
            const isSale = tx.paymentCurrency && tx.paymentAmount; // SELL: Has received currency and amount

            if (isSale) {
                // SELL Transaction: Debit Cash Received, Credit Asset Sold
                entries.push({
                    txId, date, txType, description: `Sell ${tx.assetSymbol}`,
                    account: tx.paymentCurrency || 'USD',
                    debit: Number(tx.paymentAmount),
                    credit: 0,
                    currency: tx.paymentCurrency || 'USD'
                });
                entries.push({
                    txId, date, txType, description: `Reduction of spot ${tx.assetSymbol}`,
                    account: tx.assetSymbol || 'ASSET',
                    debit: 0,
                    credit: Number(tx.amount),
                    currency: tx.assetSymbol || 'ASSET'
                });
            } else if (lpMoveMatch) {
                const lpSymbol = lpMoveMatch[1];
                // LP Funding: Debit LP Account, Credit Spot Asset
                entries.push({
                    txId, date, txType, description: `Contribute to ${lpSymbol}`,
                    account: lpSymbol, debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol || 'ASSET'
                });
                entries.push({
                    txId, date, txType, description: `Transferred to LP`,
                    account: tx.assetSymbol || 'ASSET', debit: 0, credit: Number(tx.amount) || 0, currency: tx.assetSymbol || 'ASSET'
                });
            } else if (isSwap) {
                // Internal Swap: Credit the asset, the corresponding DEPOSIT asset will handle the Debit.
                // We use a "CLEARING" description to show it stayed internal.
                entries.push({
                    txId, date, txType, description: `Swap Out: ${tx.notes}`,
                    account: tx.assetSymbol || 'ASSET', debit: 0, credit: Number(tx.amount) || 0, currency: tx.assetSymbol || 'ASSET'
                });
            } else {
                // Regular Withdrawal (External)
                entries.push({
                    txId, date, txType, description: `Withdraw ${tx.assetSymbol}`,
                    account: 'EXTERNAL_OUTFLOW', debit: Number(tx.amount) || 0, credit: 0, currency: tx.assetSymbol || 'ASSET'
                });
                entries.push({
                    txId, date, txType, description: `Reduction of spot ${tx.assetSymbol}`,
                    account: tx.assetSymbol || 'ASSET', debit: 0, credit: Number(tx.amount) || 0, currency: tx.assetSymbol || 'ASSET'
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

/**
 * Calculates net balances for all accounts based on journal entries.
 * Returns a map of { [accountName]: { [currency]: balance } }
 */
export const getLedgerBalances = (transactions: Transaction[]): Record<string, Record<string, number>> => {
    const entries = getJournalEntries(transactions);
    const balances: Record<string, Record<string, number>> = {};

    entries.forEach(entry => {
        const acc = entry.account.trim().toUpperCase();
        const cur = entry.currency.trim().toUpperCase();

        if (!balances[acc]) balances[acc] = {};
        if (!balances[acc][cur]) balances[acc][cur] = 0;

        balances[acc][cur] += (entry.debit - entry.credit);
    });

    return balances;
};
