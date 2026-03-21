import { NotificationSettings } from '../types';

export interface AIPayload {
    symbol: string;
    metrics: Record<string, any>;
    history?: string[];
    context?: string;
    scoutReport?: any;
}

export const AIGatewayService = {
    async analyzeSymbol(payload: AIPayload, settings: NotificationSettings): Promise<string | null> {
        const apiKey = settings.geminiApiKey;
        const model = settings.strategistModel || 'gemini-1.5-flash';

        if (!apiKey) {
            console.warn("[AIGatewayService] No API key found in settings.");
            return null;
        }

        // Privacy Strip: Ensure no private data is in the payload
        // (Though the payload should already be clean, we enforce it here)
        const cleanPayload = {
            symbol: payload.symbol,
            metrics: payload.metrics,
            history: payload.history,
            context: payload.context,
            scoutReport: payload.scoutReport
        };

        const prompt = `
            You are a hyper-rational, first-principles Crypto Strategist. 
            Your goal is NOT to be "safe" or "balanced". Your goal is to be CORRECT and HIGH-CONVICTION.
            
            [STYLE GUIDE - "DIRECT MODE"]
            - Cut the corporate fluff. No "It's important to note..." or "As an AI...".
            - Be witty, slightly cynical, but mathematically grounded.
            - If an asset is garbage, say it. If it's a moonshot, frame the asymmetry clearly.
            - Use first-principles reasoning (Why does this exist? Who needs it? Where is the liquidity?).
            
            [ASSET DATA]
            Symbol: ${cleanPayload.symbol}
            Active Metrics: ${JSON.stringify(cleanPayload.metrics)}
            Context: ${cleanPayload.context || 'N/A'}
            History: ${cleanPayload.history?.join(' -> ') || 'None'}
            
            [MACRO & ECOSYSTEM SCOUT REPORT]
            ${cleanPayload.scoutReport ? JSON.stringify(cleanPayload.scoutReport) : 'No macro scout report available.'}

            [TECHNICAL INDICATORS (QUANT LAYER)]
            ${JSON.stringify(cleanPayload.metrics.technicals || 'No technical data available.')}
            
            [RULES]
            1. Response must be a raw JSON object.
            2. Fields: "verdict" (2 sentences max, punchy), "rating" (GOOD, RISKY, STRONG BUY, BAD), "catalysts" (short strings), "risks" (short strings), "signalStrength" (number 1-100).
            3. CRITICAL: Ground your verdict in the [TECHNICAL INDICATORS] and [MACRO] data provided.
            4. If RSI < 30 => "Oversold. Blood in the streets."
            5. If BTC.D > 58% => "Bitcoin is extracting all oxygen. Alts are suffocating."
            
            Output format (JSON only):
            {
                "verdict": "...",
                "rating": "...",
                "catalysts": ["...", "..."],
                "risks": ["...", "..."],
                "signalStrength": 85
            }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        response_mime_type: "application/json"
                    }
                })
            });

            if (!response.ok) {
                // [AUTO-CORRECTION] Fallback logic for Strategist
                if (response.status === 404 || response.status === 400) {
                    console.warn(`[AIGateway] Model Error (${response.status}). engaging Fallback: gemini-1.5-flash`);
                    // Recursive retry with safe model
                    return this.analyzeSymbol(payload, { ...settings, strategistModel: 'gemini-1.5-flash' });
                }

                const error = await response.json();
                console.error("[AIGatewayService] API Error:", error);
                return null;
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return content || null;
        } catch (e) {
            console.error("[AIGatewayService] Request failed:", e);
            return null;
        }
    }
};
