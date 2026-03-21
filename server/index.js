import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scoutAgent } from './agents/ScoutAgent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// [API] Scout Agent Trigger
app.post('/api/scout/trigger', async (req, res) => {
    console.log("[SERVER] 📡 Received Scout Trigger:", req.body);
    try {
        const result = await scoutAgent.runMission();
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("[SERVER] Scout Mission Failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// [API] Deep Research (Thinker Support)
app.post('/api/scout/research', async (req, res) => {
    const { query } = req.body;
    console.log(`[SERVER] 🧠 Received Research Request: "${query}"`);
    try {
        const results = await scoutAgent.research(query);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("[SERVER] Research Failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// [API] Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', mode: 'Unified Web Platform' });
});

/**
 * [GET] /api/health/investment
 * [MONITORING] Detailed health endpoint for monitoring services.
 * Returns main dashboard status, API availability, and system health.
 */
app.get('/api/health/investment', async (req, res) => {
    try {
        // Check if Scout agent is responsive
        let scoutHealthy = false;
        try {
            // Just check if scoutAgent is available
            scoutHealthy = scoutAgent !== undefined;
        } catch {
            scoutHealthy = false;
        }

        const isHealthy = scoutHealthy;

        res.json({
            status: isHealthy ? 'healthy' : 'degraded',
            service: 'investment-dashboard',
            timestamp: Date.now(),
            uptime: Math.round(process.uptime()),
            details: {
                api: 'available',
                scoutAgent: scoutHealthy ? 'connected' : 'unavailable',
                port: PORT,
                mode: 'Unified Web Platform'
            }
        });
    } catch (e) {
        res.status(500).json({
            status: 'error',
            service: 'investment-dashboard',
            error: e.message
        });
    }
});

// [FRONTEND] Serve React App (Production Build)
// [FRONTEND] Serve React App (Production Build)
const distPath = join(__dirname, '../dist');
import fs from 'fs';
console.log(`[SERVER_DEBUG] Static Path: ${distPath}`);
console.log(`[SERVER_DEBUG] index.html exists? ${fs.existsSync(join(distPath, 'index.html'))}`);

app.use(express.static(distPath));

// [SPA] Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
    🚀 ALPHA VAULT UNIFIED SERVER
    =============================
    Url: http://localhost:${PORT}
    Mode: Digital HQ (Web)
    `);
});
