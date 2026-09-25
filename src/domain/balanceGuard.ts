import { Transaction } from '../types';
import { calculateAssets } from './portfolioCalculator';

const EPS = 1e-6;
const MATCH_TOLERANCE = 0.01;

const norm = (s: string) => s.trim().toUpperCase();

const isSelfPayment = (t: Transaction) =>
    !!t.paymentCurrency && norm(t.paymentCurrency) === norm(t.assetSymbol);

const paysFromHoldings = (t: Transaction) =>
    t.type === 'DEPOSIT' && !!t.paymentCurrency && !!t.paymentAmount &&
    norm(t.paymentCurrency) !== 'USD' && !isSelfPayment(t);

const amountsMatch = (a: number, b: number) =>
    Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * MATCH_TOLERANCE;

// Checks a batch of new transactions for the two silent-corruption patterns in calculateAssets:
// spending more than the tracked balance, and logging one swap as both a WITHDRAWAL and a paymentCurrency debit.
export const findBalanceIssues = (existing: Transaction[], batch: Transaction[]): string[] => {
    const issues: string[] = [];
    const balances: Record<string, number> = {};
    calculateAssets(existing, {}).forEach(a => { balances[a.symbol] = a.quantity; });

    const debits: Record<string, number> = {};
    const credits: Record<string, number> = {};
    const add = (map: Record<string, number>, sym: string, amt: number) => { map[sym] = (map[sym] || 0) + amt; };

    batch.forEach(t => {
        const sym = norm(t.assetSymbol);
        if (t.type === 'WITHDRAWAL' || t.type === 'SELL') add(debits, sym, Number(t.amount) || 0);
        if (t.type === 'SELL' && t.paymentCurrency && t.paymentAmount) add(credits, norm(t.paymentCurrency), Number(t.paymentAmount));
        if (t.type === 'DEPOSIT' && !isSelfPayment(t)) add(credits, sym, Number(t.amount) || 0);
        if (t.type === 'INTEREST') add(credits, sym, Number(t.amount) || 0);
        if (paysFromHoldings(t)) add(debits, norm(t.paymentCurrency!), Number(t.paymentAmount));
    });

    Object.entries(debits).forEach(([sym, spent]) => {
        const available = (balances[sym] || 0) + (credits[sym] || 0);
        if (spent > available + EPS) {
            issues.push(`${sym}: spending ${fmt(spent)} but only ${fmt(available)} is tracked. The balance will be floored or go negative and silently drop off the Tokens list.`);
        }
    });

    const all = [...existing, ...batch];
    batch.forEach(t => {
        if (paysFromHoldings(t)) {
            const pay = norm(t.paymentCurrency!);
            const dup = all.find(w =>
                w !== t && w.type === 'WITHDRAWAL' && norm(w.assetSymbol) === pay && w.date === t.date &&
                w.subType !== 'LP_FUNDING' && w.linkedTransactionId !== t.id && t.linkedTransactionId !== w.id &&
                amountsMatch(Number(w.amount), Number(t.paymentAmount)));
            if (dup) issues.push(`${pay}: a WITHDRAWAL of ${fmt(dup.amount)} ${pay} on ${t.date} already exists. This DEPOSIT also debits ${pay} via payment currency, so the swap would be counted twice.`);
        }
        if (t.type === 'WITHDRAWAL' && t.subType !== 'LP_FUNDING') {
            const sym = norm(t.assetSymbol);
            const dup = all.find(d =>
                d !== t && paysFromHoldings(d) && norm(d.paymentCurrency!) === sym && d.date === t.date &&
                d.linkedTransactionId !== t.id && t.linkedTransactionId !== d.id &&
                amountsMatch(Number(d.paymentAmount), Number(t.amount)));
            if (dup && !batch.includes(dup)) issues.push(`${sym}: the ${dup.assetSymbol} DEPOSIT on ${t.date} already debits ${fmt(dup.paymentAmount!)} ${sym} via payment currency. This WITHDRAWAL would count the swap twice.`);
        }
    });

    return issues;
};

const fmt = (n: number) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 6 });
