import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// [ARCHITECT] Manual Agentic Control (Phase 33)
// Usage in console: _scout.forceAgenticRefill()
import { highFidelityScoutService } from './services/HighFidelityScoutService';

(window as any)._scout = {
    forceAgenticRefill: () => highFidelityScoutService.performMission(),
    getMissionLog: () => JSON.parse(localStorage.getItem('scout:logs') || '[]')
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
console.log('[DEBUG] main.tsx render called');
