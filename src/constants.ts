/**
 * Centralized constants for the Vault.
 * This file serves as the "Source of Truth" for shared literals.
 */

export const STABLE_SYMBOLS = ['USDT', 'USDC', 'USD', 'PYUSD', 'DAI', 'BUSD'];

export const TRANSACTION_TYPES = {
    DEPOSIT: 'DEPOSIT',
    WITHDRAW: 'WITHDRAW',
    INTEREST: 'INTEREST',
    BORROW: 'BORROW',
    REPAY: 'REPAY'
} as const;

export const INTEREST_TYPES = ['INTEREST', 'STAKING', 'REWARD', 'YIELD'];

export const LOCAL_STORAGE_KEYS = {
    BUCKET_OVERRIDES: 'vault_bucket_overrides',
    FUNDING_OFFSET: 'vault_funding_total_offset',
    NOTIFICATION_SETTINGS: 'investment_tracker_notification_settings',
    LAST_SENT_PICKS: 'investment_tracker_last_picks_notif',
    STRATEGIST_LAST_CHECK: 'strategist_last_intel_check',
    BASE_FIX_APPLIED: 'investment_tracker_base_fix_applied',
    THEME: 'theme'
};

export const UI_DEFAULTS = {
    LOCALE: 'en-US',
    CURRENCY: 'USD'
};
