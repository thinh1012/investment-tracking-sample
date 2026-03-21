import { chromium } from 'file:///C:/Users/ducth/AppData/Roaming/npm/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto('http://127.0.0.1:5174');
await page.waitForTimeout(3000);

// LP Positions
await page.screenshot({ path: 'H:/investment-tracking/ss-1-lp-positions.png', fullPage: true });
console.log('1: LP Positions');

// Earnings - Earnings History
await page.locator('text=Earnings').first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'H:/investment-tracking/ss-2-earnings-history.png', fullPage: true });
console.log('2: Earnings History');

// Earnings - LP Yield Tracker
await page.locator('text=LP Yield Tracker').first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'H:/investment-tracking/ss-3-yield-tracker.png', fullPage: true });
console.log('3: LP Yield Tracker');

// Earnings - Transaction Ledger
await page.locator('text=Transaction Ledger').first().click();
await page.waitForTimeout(1000);
// open Recent Transactions
await page.locator('text=Recent Transactions').first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'H:/investment-tracking/ss-4-transaction-ledger.png', fullPage: true });
console.log('4: Transaction Ledger');

// Settings
await page.locator('text=Settings').first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'H:/investment-tracking/ss-5-settings.png', fullPage: true });
console.log('5: Settings');

await browser.close();
console.log('Done.');
