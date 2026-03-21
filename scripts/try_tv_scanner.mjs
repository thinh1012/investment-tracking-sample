
// Probe script to fetch data from TradingView Scanner API
// Target: EXACT CRYPTOCAP:USDT.D value

// Standalone script to verify TradingView Scanner API access
// Target: EXACT CRYPTOCAP:USDT.D value

async function probeScanner() {
    console.log("Probing TradingView Scanner API...");

    const url = "https://scanner.tradingview.com/crypto/scan";
    const body = {
        "symbols": {
            "tickers": ["CRYPTOCAP:USDT.D", "CRYPTOCAP:USDC.D", "CRYPTOCAP:BTC.D", "CRYPTOCAP:OTHERS.D"]
        },
        "columns": ["close"]
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.error(`Status: ${res.status} ${res.statusText}`);
            const txt = await res.text();
            console.error(txt);
            return;
        }

        const json = await res.json();
        console.log("Scanner Response:", JSON.stringify(json, null, 2));

        // Parse results
        // Response format is usually { data: [ { s: 'symbol', d: [value] } ] }
        if (json.data) {
            console.log("\n--- Parsed Values ---");
            json.data.forEach(item => {
                console.log(`${item.s}: ${item.d[0]}%`);
            });
            console.log("---------------------");
        }

    } catch (e) {
        console.error("Probe Failed:", e);
    }
}

// Check if fetch is globally available (Node 18+), else might fail if node-fetch not installed.
// We'll trust the environment has a recent Node or try to use https module if needed, 
// but let's try the simple way first.
probeScanner();
