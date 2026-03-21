const fs = require('fs');
console.log("--- DIAGNOSTIC PROBE ---");
console.log("ExecPath:", process.execPath);
console.log("Env RUN_AS_NODE:", process.env.ELECTRON_RUN_AS_NODE);
console.log("Versions:", process.versions);

try {
    console.log("Attempting require('electron')...");
    const e = require('electron');
    console.log("Result Type:", typeof e);
    if (typeof e === 'string') {
        console.log("Shadowed Value:", e);
    } else {
        console.log("Keys found:", Object.keys(e).join(', '));
    }
} catch (err) {
    console.error("Require failed:", err.message);
}

try {
    const eMain = require('electron/main');
    console.log("require('electron/main') success");
} catch (err) {
    console.log("require('electron/main') failed:", err.message);
}

console.log("Module Paths:", module.paths);
console.log("--- END PROBE ---");

// Force exit if we are in Electron to avoid hanging
if (process.versions.electron) {
    try {
        require('electron').app.quit();
    } catch (e) { process.exit(0); }
}
