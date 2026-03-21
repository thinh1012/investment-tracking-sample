import { chromium } from 'file:///C:/Users/ducth/AppData/Roaming/npm/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: false, slowMo: 400 });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

await page.goto('http://127.0.0.1:5174');
await page.waitForTimeout(3000);

// Navigate to Earnings page
await page.locator('text=Earnings').first().click();
await page.waitForTimeout(1500);

// Click "Transaction Ledger" tab
await page.locator('text=Transaction Ledger').first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'H:/investment-tracking/test-search-1-ledger.png' });
console.log('Screenshot 1: Transaction Ledger tab');

// Find Recent Transactions header
const recentTxHeader = page.locator('text=Recent Transactions').first();
const found = await recentTxHeader.isVisible().catch(() => false);
console.log('Recent Transactions header found:', found);

if (!found) {
    // Maybe it needs scrolling
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'H:/investment-tracking/test-search-1b-scrolled.png' });
    const found2 = await recentTxHeader.isVisible().catch(() => false);
    console.log('After scroll:', found2);
}

const isOpen = await recentTxHeader.isVisible().catch(() => false);
if (isOpen) {
    await recentTxHeader.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'H:/investment-tracking/test-search-2-opened.png' });
    console.log('Screenshot 2: Section opened');

    const debugLine = page.locator('.text-rose-500').first();
    const debugBefore = await debugLine.textContent().catch(() => 'not found');
    console.log('Debug line before typing:', debugBefore);

    const searchInput = page.locator('input[placeholder="Filter by ticker, type or notes..."]');
    const isVisible = await searchInput.isVisible().catch(() => false);
    console.log('Search input visible:', isVisible);

    if (isVisible) {
        await searchInput.click();
        await searchInput.fill('BUY');
        await page.waitForTimeout(600);
        await page.screenshot({ path: 'H:/investment-tracking/test-search-3-buy.png' });
        const debugBuy = await debugLine.textContent().catch(() => '');
        console.log('After "BUY":', debugBuy);

        await searchInput.fill('ETH');
        await page.waitForTimeout(600);
        await page.screenshot({ path: 'H:/investment-tracking/test-search-4-eth.png' });
        const debugEth = await debugLine.textContent().catch(() => '');
        console.log('After "ETH":', debugEth);

        await searchInput.fill('');
        await page.waitForTimeout(300);
        const debugClear = await debugLine.textContent().catch(() => '');
        console.log('After clear:', debugClear);
    }
}

await browser.close();
console.log('\nDone.');
