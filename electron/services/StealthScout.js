const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

class StealthScout {
    static async runMission(missionUrl, scriptType, params = {}) {
        console.log(`[VISIBLE_SCOUT] 🕵️ Starting Mission: ${missionUrl} (Type: ${scriptType})`);

        const scoutWin = new BrowserWindow({
            width: 1200,
            height: 800,
            show: true,
            title: "Scout Agent - Collecting Intelligence...",
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true
            }
        });

        try {
            await scoutWin.loadURL(missionUrl, {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });

            // Human Simulation (Dynamic Timing)
            const baseWait = (params.captureDelay || 5) * 1000;
            const jitter = Math.floor(Math.random() * (params.randomFactor || 2) * 1000);
            const waitTime = baseWait + jitter;

            console.log(`[VISIBLE_SCOUT] ⏳ Waiting ${waitTime}ms (Base: ${baseWait}ms, Jitter: ${jitter}ms)...`);
            await new Promise(r => setTimeout(r, waitTime));

            // Extract Data
            const extractionScript = this.getScript(scriptType, params);
            const result = await scoutWin.webContents.executeJavaScript(extractionScript);

            console.log(`[VISIBLE_SCOUT] ✅ Mission Success. Data:`, result);

            // Cleanup
            scoutWin.close();
            return result;

        } catch (e) {
            console.error(`[VISIBLE_SCOUT] ❌ Mission Failed:`, e);
            if (!scoutWin.isDestroyed()) scoutWin.close();
            return { error: e.message };
        }
    }

    static getScript(type, params = {}) {
        if (type === 'CUSTOM_SELECTOR' && params.selector) {
            return `(() => {
                const element = document.querySelector(${JSON.stringify(params.selector)});
                if (element) {
                    const rawText = element.innerText || element.textContent || '';
                    
                    // HEURISTIC: Deconstruct the row into high-signal pieces
                    // We look for numbers, currency signs, and percentages
                    const chips = rawText.split(/[\\n\\r|]+/).map(s => s.trim()).filter(Boolean);
                    const numericMatch = rawText.match(/[\\d,]+(\\.\\d+)?%?/g);
                    
                    return {
                        type: 'CUSTOM_METRIC',
                        data: {
                            label: ${JSON.stringify(params.label || 'Metric')},
                            value: numericMatch ? numericMatch[0] : rawText, // Best guess at "The Number"
                            captured: chips, // All discovered strings in the row
                            rowText: rawText.replace(/\\n/g, ' '),
                            selector: ${JSON.stringify(params.selector)}
                        },
                        source: window.location.href,
                        intelligenceScore: numericMatch ? 95 : 70
                    };
                }
                return { error: 'Selector not found: ' + ${JSON.stringify(params.selector)} };
            })()`;
        }

        if (type === 'ETF_INFLOW') {
            return `(() => {
                const rows = document.querySelectorAll('.ant-table-row');
                for (const row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 10) {
                        const date = cells[0]?.innerText;
                        const inflow = cells[12]?.innerText;
                        if (date && inflow) {
                            return { 
                                type: 'ETF_INFLOW', 
                                data: { date, inflow }, 
                                source: 'Coinglass ETF',
                                intelligenceScore: 85
                            };
                        }
                    }
                }
                return { error: 'Table structure changed' };
            })()`;
        }

        if (type === 'VISIT_ONLY' || type === 'GENERIC_PAGE_DATA') {
            return `(() => {
                return {
                    type: 'GENERAL_INTEL',
                    data: {
                        title: document.title,
                        description: document.querySelector('meta[name="description"]')?.content || 'No description found',
                        h1: document.querySelector('h1')?.innerText || 'No H1 found',
                        linksCount: document.querySelectorAll('a').length,
                        capturedAt: new Date().toISOString()
                    },
                    source: window.location.href,
                    intelligenceScore: 40
                };
            })()`;
        }

        return `(() => ({ 
            type: 'UNKNOWN', 
            error: 'No specific script for ' + ${JSON.stringify(type)},
            source: window.location.href
        }))()`;
    }
}

module.exports = StealthScout;
