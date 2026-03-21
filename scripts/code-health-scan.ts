
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../src/data/code-health.json');

interface FileStats {
    name: string;
    lines: number;
    todos: number;
    size: number;
}

interface CodeHealthReport {
    timestamp: number;
    totalFiles: number;
    totalLines: number;
    totalTodos: number;
    riskScore: number; // 0-100 (100 is bad)
    topOffenders: FileStats[];
}

function scanDirectory(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            scanDirectory(filePath, fileList);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

function analyze(): CodeHealthReport {
    console.log('🕵️ [CODE_REVIEWER] Starting Codebase Audit...');
    const files = scanDirectory(SRC_DIR);

    let totalLines = 0;
    let totalTodos = 0;
    const fileStats: FileStats[] = [];

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n').length;
        const todos = (content.match(/\/\/ TODO/g) || []).length + (content.match(/\/\/ FIXME/g) || []).length;

        totalLines += lines;
        totalTodos += todos;

        if (lines > 300 || todos > 0) {
            fileStats.push({
                name: path.basename(file),
                lines,
                todos,
                size: lines
            });
        }
    });

    // Calculate Risk Score & Health
    // Risk increases with lines (bloat) and TODOs (debt)
    const lineRisk = Math.min(50, totalLines / 200); // Max 50 pts if > 10k lines
    const todoRisk = Math.min(50, totalTodos * 2); // Max 50 pts if > 25 TODOs
    const riskScore = Math.min(100, Math.round(lineRisk + todoRisk));

    return {
        timestamp: Date.now(),
        totalFiles: files.length,
        totalLines,
        totalTodos,
        riskScore,
        topOffenders: fileStats.sort((a, b) => b.lines - a.lines).slice(0, 5)
    };
}

const report = analyze();

// Ensure output dir exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

console.log(`✅ [CODE_REVIEWER] Audit Complete.`);
console.log(`   - Files: ${report.totalFiles}`);
console.log(`   - Lines: ${report.totalLines}`);
console.log(`   - TODOs: ${report.totalTodos}`);
console.log(`   - Risk: ${report.riskScore}/100`);
console.log(`   - Report saved to: src/data/code-health.json`);
