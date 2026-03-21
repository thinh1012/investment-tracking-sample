export type TransactionType = 'DEPOSIT' | 'INTEREST' | 'WITHDRAWAL' | 'TRANSFER' | 'BUY' | 'SELL' | 'BORROW' | 'REPAY';

export interface NotificationConfig {
    service: string;
    user: string;
    pass: string;
    targetEmail: string;
    targetPhone?: string; // For future SMS
    enabled: boolean;
}

export interface EmailMessage {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export type InterestType = 'INTEREST' | 'STAKING' | 'REWARD' | 'YIELD' | 'SAVINGS' | 'FARMING' | 'LENDING' | 'OTHER';

export interface Transaction {
    id: string;
    date: string;
    assetSymbol: string;
    type: TransactionType;
    amount: number;
    pricePerUnit?: number; // For DEPOSIT
    interestType?: InterestType; // For INTEREST
    platform?: string; // For INTEREST (Destination) and TRANSFER (Destination)
    source?: string; // For TRANSFER (Source)
    notes?: string;
    paymentCurrency?: string; // Symbol of asset used to pay (e.g. 'USDC', 'USD')
    paymentAmount?: number; // Amount of payment currency spent
    linkedTransactionId?: string; // ID of the parent transaction (e.g. LP creation) that this tx is linked to
    fee?: number;
    feeCurrency?: string;
    lpRange?: { min: number; max: number };
    monitorSymbol?: string; // For LP Range Check (e.g. 'ETH')
    relatedAssetSymbol?: string; // For INTEREST, to link to source LP (e.g. 'LP-ETH-USDC')
    relatedAssetSymbols?: string[]; // For INTEREST, to link to multiple source LPs or Assets
    isCompound?: boolean; // If true, this tx increases principal without being "Fresh Capital"
    createdAt?: number; // Unix timestamp of when transaction was inputted into the system
}

export interface Asset {
    symbol: string;
    quantity: number;
    totalInvested: number; // Fiat value
    averageBuyPrice: number;
    currentPrice: number; // Fetched from API
    currentValue: number; // quantity * currentPrice
    unrealizedPnL: number; // currentValue - totalInvested
    pnlPercentage: number; // (unrealizedPnL / totalInvested) * 100
    realizedPnL?: number; // Profit/loss from SELL transactions

    // LP Specific
    lpRange?: { min: number; max: number };
    monitorSymbol?: string;
    monitorPrice?: number;
    inRange?: boolean;

    // Breakdown Stats
    earnedQuantity?: number;
    lockedInLpQuantity?: number;
    fundedFromHoldings?: number; // LP deposits funded from existing holdings (not fresh capital)

    // Config
    rewardTokens?: string[]; // e.g. ['HYPE', 'USDC']
    compoundedPrincipal?: number; // Total reinvested rewards
    valuationSource?: 'SATELLITE' | 'ESCALATION' | 'CACHE' | 'COST_BASIS';
}


export interface PortfolioSummary {
    totalValue: number;
    totalInvested: number; // The "Fresh Capital" from user's bank
    totalPnL: number;
    compoundedGrowth?: number; // The "House Money" reinvested
}

export interface NotificationSettings {
    // Telegram
    telegramBotToken?: string;
    telegramChatId?: string;

    // EmailJS
    emailServiceId?: string;
    emailTemplateId?: string;
    emailPublicKey?: string; // User ID

    // Global Toggles
    lpRangeChecksEnabled?: boolean;

    // Custom Templates
    priceAlertTemplate?: string;
    lpAlertTemplate?: string;

    // Periodic Market Updates
    marketPicksNotifEnabled?: boolean;
    marketPicksNotifInterval?: number; // in milliseconds
    marketPicksAlertTemplate?: string;

    // Cloud Sync
    cloudSyncEnabled?: boolean;
    cloudSyncInterval?: number; // in minutes

    // AI Strategist Settings
    geminiApiKey?: string;
    aiProvider?: 'GEMINI' | 'OPENAI' | 'ANTHROPIC';
    strategistModel?: string;

    // Scout Automation
    scoutAutomationEnabled?: boolean;

    // WhatsApp (CallMeBot)
    whatsappPhone?: string;
    whatsappApiKey?: string;

    // Volatility Alerts
    volatilityThreshold?: number; // e.g. 1000 for $1000 move
    volatilityTemplate?: string;
    volatilityWindowMinutes?: number;
    volatilityTelegramEnabled?: boolean;
    volatilityWhatsappEnabled?: boolean;
}

export type AlertCondition = 'ABOVE' | 'BELOW';
export type NotificationChannel = 'APP' | 'TELEGRAM' | 'EMAIL' | 'WHATSAPP';

export interface PriceAlert {
    id: string;
    symbol: string;
    targetPrice: number;
    condition: AlertCondition;
    channels: NotificationChannel[];
    isActive: boolean;
    lastTriggeredAt?: number;
}

export interface NotificationLog {
    id: string;
    date: number;
    channel: NotificationChannel;
    recipient: string;
    message: string;
    status: 'SUCCESS' | 'FAILURE';
    error?: string;
    type: 'PRICE' | 'LP' | 'SYSTEM';
}
