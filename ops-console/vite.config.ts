import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'Digital HQ - Ops Console',
                short_name: 'OpsConsole',
                description: 'Command Center for Alpha Vault',
                theme_color: '#0f172a',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        }),
        tailwindcss(),
        {
            name: 'ledger-server',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === '/api/ledger/task.md') {
                        try {
                            const taskPath = 'c:\\Users\\ducth\\.gemini\\antigravity\\brain\\61ce86d8-3a0c-4c8a-b497-31e450a98ed1\\task.md';
                            if (fs.existsSync(taskPath)) {
                                const content = fs.readFileSync(taskPath, 'utf-8');
                                res.setHeader('Content-Type', 'text/markdown');
                                res.end(content);
                            } else {
                                res.statusCode = 404;
                                res.end('Task file not found');
                            }
                        } catch (e: any) {
                            res.statusCode = 500;
                            res.end(`Server Error: ${e.message}`);
                        }
                    } else if (req.url === '/api/audit/health') {
                        try {
                            // [ARCHITECT] Robust Path Resolution
                            const srcDir = path.join(process.cwd(), 'src');
                            console.log(`[AUDIT] Starting scan on: ${srcDir}`);

                            if (!fs.existsSync(srcDir)) {
                                res.statusCode = 404;
                                res.end(JSON.stringify({ error: `Source directory not found at ${srcDir}` }));
                                return;
                            }

                            let totalLines = 0;
                            let totalTodos = 0;
                            const offenders: any[] = [];

                            const walkDir = (dir: string) => {
                                const files = fs.readdirSync(dir);
                                files.forEach(file => {
                                    const filePath = path.join(dir, file);
                                    const stat = fs.statSync(filePath);
                                    if (stat.isDirectory()) {
                                        walkDir(filePath);
                                    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                                        const content = fs.readFileSync(filePath, 'utf-8');
                                        const lines = content.split('\n');
                                        totalLines += lines.length;

                                        // Count TODOs (Case Insensitive)
                                        const todosCount = (content.match(/TODO/gi) || []).length;
                                        totalTodos += todosCount;

                                        if (lines.length > 200) { // Lowered threshold for visibility
                                            offenders.push({
                                                name: path.relative(srcDir, filePath),
                                                lines: lines.length,
                                                todos: todosCount,
                                                risk: lines.length > 400 ? 'High' : lines.length > 250 ? 'Medium' : 'Low'
                                            });
                                        }
                                    }
                                });
                            };

                            walkDir(srcDir);

                            const healthScore = Math.max(0, 100 - (totalTodos * 0.5) - (offenders.length * 2));

                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                totalLines: totalLines.toLocaleString(),
                                totalTodos,
                                offenders: offenders.sort((a, b) => b.lines - a.lines).slice(0, 8),
                                healthScore: Math.round(healthScore)
                            }));
                        } catch (e: any) {
                            console.error(`[AUDIT] Bridge Failure: ${e.message}`);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: `Internal Audit Error: ${e.message}` }));
                        }
                    } else {
                        next();
                    }
                });
            }
        }
    ],
    server: {
        port: 5188,
        strictPort: true,
        host: '127.0.0.1',
        proxy: {
            '/api/cryptopanic': {
                target: 'https://cryptopanic.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/cryptopanic/, '')
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, '../src')
        }
    }
});
