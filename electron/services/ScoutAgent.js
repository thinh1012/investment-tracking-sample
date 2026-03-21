
const { BrowserWindow } = require('electron');

class ScoutAgent {
    constructor() {
        this.minDelay = 2500;
        this.maxDelay = 20000;
        this.targets = [
            {
                name: 'USDT.D',
                url: 'https://www.tradingview.com/symbols/USDT.D/',
                selector: '.last-value-value', // Example selector, will need refinement
                type: 'text'
            },
            {
                name: 'USDC.D',
                url: 'https://www.tradingview.com/symbols/USDC.D/',
                selector: '.last-value-value',
                type: 'text'
            },
            {
                name: 'OTHERS',
                url: 'https://www.tradingview.com/symbols/OTHERS/',
                selector: '.last-value-value',
                type: 'text'
            }
            // Add other targets from user_note.txt as needed for V1
        ];
    }

    setDelayRange(min, max) {
        this.minDelay = min;
        this.maxDelay = max;
        console.log(`[SCOUT_AGENT] Delay Range Updated: ${min}ms - ${max}ms`);
    }

    async runMission() {
        console.log('[SCOUT_AGENT] Starting Secret Mission...');
        const results = {};

        // Spawn Hidden Window
        const win = new BrowserWindow({
            width: 1280,
            height: 800,
            show: true, // VISIBLE MODE (User Request)
            webPreferences: {
                offscreen: false, // Turn off offscreen rendering for visibility
                contextIsolation: true
            }
        });

        for (const target of this.targets) {
            let attempts = 0;
            let success = false;
            const MAX_RETRIES = 3;

            while (attempts < MAX_RETRIES && !success) {
                attempts++;
                try {
                    // 1. Human-Like Delay (applies to first run AND retries)
                    const delay = Math.floor(Math.random() * (this.maxDelay - this.minDelay + 1)) + this.minDelay;

                    if (attempts > 1) {
                        console.log(`[SCOUT_AGENT] 🔄 Retry ${attempts}/${MAX_RETRIES} for ${target.name}. Waiting ${delay}ms...`);
                    } else {
                        console.log(`[SCOUT_AGENT] ⏳ Waiting ${delay}ms before visiting ${target.name}...`);
                    }

                    await new Promise(r => setTimeout(r, delay));

                    // 2. Navigate
                    console.log(`[SCOUT_AGENT] 🕵️ Visiting ${target.url}...`);
                    await win.loadURL(target.url);

                    // 3. Extract Data (Robust Fallback System)
                    // TradingView is an SPA. We must wait for the TITLE to contain the data (Number).
                    const data = await win.webContents.executeJavaScript(`
                        (async () => {
                            const waitForDataInTitle = () => new Promise(resolve => {
                                 let checks = 0;
                                 const int = setInterval(() => {
                                     // Wait for a number (price/pct) to appear in title
                                     // e.g. "USDT.D 6.33% ..."
                                     if (/[0-9]/.test(document.title) || checks > 20) { 
                                         clearInterval(int);
                                         resolve();
                                     }
                                     checks++;
                                 }, 500);
                            });
                            
                            await waitForDataInTitle();
                            
                            // Strategy A: Parse Title (Best for Chart Page)
                            const title = document.title;
                            // Regex: Must have digits, optional decimal, optional percent
                            const titleMatch = title.match(/([0-9]+\.[0-9]+|[0-9]+)%?/);
                            if (titleMatch) return titleMatch[0];

                            // Strategy B: Specific Selectors (Best for Overview Page)
                            // TradingView generally uses these for the big main number
                            const selectors = [
                                '.js-symbol-last', 
                                '.tv-symbol-price-quote__value',
                                'span[class*="lastValue"]',
                                'div[class*="lastValue"]',
                                'span[class*="price-wrapper"]'
                            ];
                            
                            for (const s of selectors) {
                                const el = document.querySelector(s);
                                if (el && el.innerText && /[0-9]/.test(el.innerText)) {
                                    return el.innerText;
                                }
                            }
                            
                            // Strategy C: Meta Description (Desperate fallback)
                            const meta = document.querySelector('meta[name="description"]');
                            if (meta) {
                                 const content = meta.content;
                                 // often "USDT.D price is 6.33%..."
                                 const metaMatch = content.match(/([0-9]+\.[0-9]+)%/);
                                 if (metaMatch) return metaMatch[1] + '%';
                            }
                            
                            return null; 
                        })();
                    `);

                    if (data) {
                        // Clean the data (remove +/-, whitespace)
                        const cleanData = data.trim().replace(/[+]/g, '');
                        console.log(`[SCOUT_AGENT] ✅ Extracted ${target.name}: ${cleanData}`);
                        results[target.name] = cleanData;
                        success = true;
                    } else {
                        const title = await win.getTitle();
                        console.warn(`[SCOUT_AGENT] ⚠️ Attempt ${attempts} failed for ${target.name}. Title: "${title}" (No number found)`);
                    }

                } catch (e) {
                    console.error(`[SCOUT_AGENT] ❌ Error scraping ${target.name} (Attempt ${attempts}):`, e.message);
                }
            }

            if (!success) {
                console.error(`[SCOUT_AGENT] ❌ Giving up on ${target.name} after ${MAX_RETRIES} attempts.`);
            }
        }

        // Cleanup
        win.close();
        console.log('[SCOUT_AGENT] Mission Complete. Window Destroyed.');
        return results;
    }
}

module.exports = new ScoutAgent();
