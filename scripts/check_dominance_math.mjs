
// Standalone script to verify DataScout logic for USDT.D
// Mirrors the exact logic added to src/services/DataScoutService.ts

async function checkDominance() {
    console.log("Fetching global crypto data from CoinGecko...");
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/global');
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();

        const pct = data.data.market_cap_percentage;
        const totalMc = data.data.total_market_cap.usd / 1e9; // Billions

        const btcP = pct.btc;
        const usdtP = pct.usdt;
        const usdcP = pct.usdc;
        const ethP = pct.eth;
        // Total3 = Others = 100 - BTC - ETH - Stablecoins? 
        // TradingView OTHERS often excludes just BTC/ETH or BTC. 
        // Our service uses: 100 - btc - eth - usdt - usdc.
        const othersP = 100 - btcP - ethP - usdtP - usdcP;

        console.log("\n--- High-Fidelity Mirror Result ---");
        console.log(`USDT.D (TradingView Target): ${usdtP.toFixed(2)}%`);
        console.log(`USDC.D (TradingView Target): ${usdcP.toFixed(2)}%`);
        console.log(`BTC.D: ${btcP.toFixed(2)}%`);
        console.log(`OTHERS.D: ${othersP.toFixed(2)}%`);
        console.log("-----------------------------------");

        // Benchmark check
        const benchmark = 6.30;
        const diff = Math.abs(usdtP - benchmark);
        console.log(`Deviation from TradingView Benchmark (${benchmark}%): ${diff.toFixed(2)}%`);

        if (diff < 0.2) {
            console.log("✅ MATCH CONFIRMED (within 0.2% variance)");
        } else {
            console.log("⚠️ VARIANCE DETECTED - Check TradingView Calculation Definition");
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

checkDominance();
