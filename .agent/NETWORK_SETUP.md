# Network & Service Architecture

## Overview
This is a distributed investment tracking system with services running across Windows and Ubuntu servers.

## Infrastructure Map

### Windows (Main Development Machine) - IP: 192.168.1.33
- **Vault Dashboard**: Port 5173 (Vite dev server) - ❌ NOT RUNNING
- **Ops Console**: Port 5174 (Vite dev server) - ✅ RUNNING (PID: 20872)
- **Thinker**: Port 3002 (AI briefing service) - ✅ RUNNING (PID: 23400)
- **Backend API**: Port 3000 (Express server with Scout Agent) - ❌ NOT RUNNING
- **Location**: `C:\Users\ducth\.gemini\antigravity\workplace\investment-tracking`

### Ubuntu Server 192.168.1.131 (Primary Services)
- **Satellite (Scout)**: Port 4000 - Main crypto intelligence/web scraping service
- **Monitor Dashboard**: Port 8080 (if deployed) - Bot API monitoring
- **Database**: `/root/server-monitor/monitor.db` - Telegram API call tracking

### Ubuntu Server 192.168.1.132 (Support Services)
- **Budget Tracking**: Port TBD
- **Reporter**: Port TBD
- **Other bots**: Various ports

## Service Dependencies

```
Vault (Windows:5173) ← Thinker (Windows:3002)
  ↓                        ↓
  └──────→ Satellite (Ubuntu:4000)
              ↓
         Telegram Bot API
              ↓
Monitor Database (Ubuntu:/root/server-monitor/monitor.db)
              ↓
    Monitor Dashboard (Ubuntu:8080)
```

## Monitoring Setup

### What's Being Tracked
- ✅ **Telegram API calls** (inbound/outbound) via `monitor-bridge-batch.js`
- ❌ **Web scraping activity** (NOT tracked by monitor)
- ❌ **Internal API calls** (NOT tracked by monitor)

### Monitor Bridge Integration
- **File**: `satellite/monitor-bridge-batch.js`
- **Initialized in**: `satellite/server.js` (lines 2 & 11)
- **Mode**: Batch (RAM-buffered, flushes every 10s or 1000 entries)
- **Bot Name**: `satellite_bot`
- **Database**: `/root/server-monitor/monitor.db`

### How It Works
1. Satellite receives Telegram message → `monitor.recordInbound()` called
2. Satellite sends Telegram reply → Monitor bridge intercepts HTTP request
3. Logs batched in RAM, flushed periodically to log file
4. Cron job processes logs into SQLite database
5. Dashboard displays hourly statistics

## Known Issues

### Network Connectivity
- User reports "buggy" VM connections
- Possible causes:
  - Proxmox/LXC container networking issues
  - Firewall blocking ports
  - Service port conflicts
  - SSH timeout/key issues

### Port Conflicts (Potential)
- Multiple Scout instances may exist on both 131 and 132
- Thinker `.env` points to 131:4000 - verify Scout is actually there
- Backend API on Windows (port 3000) may be redundant

## Configuration Files

### Thinker `.env` (investment-tracking/thinker/.env)
```env
PORT=3002  # Running on Windows, not Ubuntu
SCOUT_API_URL=http://192.168.1.131:4000  # ✅ Correct - Scout on Ubuntu
VAULT_API_URL=http://127.0.0.1:5173  # ✅ Correct - Vault on same machine (Windows)
```

### Satellite (investment-tracking/satellite/server.js)
```javascript
const PORT = process.env.PORT || 4000;
```

## Diagnostic Commands

### Check Windows Ports
```powershell
netstat -ano | findstr "3000 5173 5174"
Test-NetConnection -ComputerName 192.168.1.131 -Port 4000
```

### Check Ubuntu Services
```bash
sudo netstat -tulpn | grep LISTEN
pm2 list
sudo lsof -i :4000
```

## Important Notes for Future Agents

1. **Don't add web scraping monitoring** - User has network issues, adding more monitoring is unnecessary
2. **Telegram monitoring is sufficient** - Tracks user-facing activity that matters
3. **Check port conflicts first** - Run diagnostics before deploying new services
4. **Verify service locations** - Don't assume Scout is on a specific server, check PM2
5. **Network issues are ongoing** - Be prepared for intermittent connectivity

## Related Documentation
- Port mapping guide: `C:\Users\ducth\.gemini\antigravity\brain\[conversation-id]\port_mapping.md`
- Server monitor README: `H:\server-monitor\README.md`
