import puppeteer from 'puppeteer';

class ScoutAgent {
    constructor() {
        this.browser = null;
    }

    async runMission() {
        console.log("[SCOUT_AGENT] 🕵️ Starting Headless Mission...");
        const report = {};

        try {
            this.browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await this.browser.newPage();

            // Mask as normal user
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1366, height: 768 });

            // 1. Harvest USDT.D
            console.log("[SCOUT_AGENT] Targeting USDT.D...");
            await page.goto('https://www.tradingview.com/symbols/USDT.D/', { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 2000)); // Human delay

            const usdtVal = await page.evaluate(() => {
                const el = document.querySelector('.last-value-fall') || document.querySelector('.last-value-rise') || document.querySelector('.tv-symbol-price-quote__value');
                return el ? el.innerText : null;
            });
            if (usdtVal) report['USDT.D'] = usdtVal;

            // 2. Harvest USDC.D
            console.log("[SCOUT_AGENT] Targeting USDC.D...");
            await page.goto('https://www.tradingview.com/symbols/USDC.D/', { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 2000));

            const usdcVal = await page.evaluate(() => {
                const el = document.querySelector('.last-value-fall') || document.querySelector('.last-value-rise') || document.querySelector('.tv-symbol-price-quote__value');
                return el ? el.innerText : null;
            });
            if (usdcVal) report['USDC.D'] = usdcVal;

            // 3. Harvest OTHERS
            console.log("[SCOUT_AGENT] Targeting OTHERS...");
            await page.goto('https://www.tradingview.com/symbols/OTHERS/', { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 2000));

            const othersVal = await page.evaluate(() => {
                const el = document.querySelector('.last-value-fall') || document.querySelector('.last-value-rise') || document.querySelector('.tv-symbol-price-quote__value');
                return el ? el.innerText : null;
            });
            if (othersVal) report['OTHERS'] = othersVal;

            console.log("[SCOUT_AGENT] Mission Complete. Report:", report);
            return report;

        } catch (error) {
            console.error("[SCOUT_AGENT] Fatal Error:", error);
            return {};
        } finally {
            if (this.browser) await this.browser.close();
        }
    }

    /**
     * Performs a targeted web search for the Thinker.
     * Uses DuckDuckGo HTML to avoid heavy JS blocking.
     */
    async research(query) {
        console.log(`[SCOUT_AGENT] 🕵️ Researching Topic: "${query}"...`);
        try {
            this.browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await this.browser.newPage();
            // Stealth User Agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // DuckDuckGo HTML Version (faster, less blocking)
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

            // Extract Results
            const results = await page.evaluate(() => {
                const items = document.querySelectorAll('.result');
                return Array.from(items).slice(0, 5).map(item => {
                    const titleEl = item.querySelector('.result__a');
                    const snippetEl = item.querySelector('.result__snippet');
                    return {
                        title: titleEl ? titleEl.innerText : 'No Title',
                        link: titleEl ? titleEl.href : '#',
                        snippet: snippetEl ? snippetEl.innerText : ''
                    };
                });
            });

            console.log(`[SCOUT_AGENT] found ${results.length} relevant results.`);
            return results;

        } catch (error) {
            console.error("[SCOUT_AGENT] Research Failed:", error);
            return [];
        } finally {
            if (this.browser) await this.browser.close();
        }
    }
}

export const scoutAgent = new ScoutAgent();
