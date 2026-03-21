import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
    // [PHASE 28] Priority: Electron Bridge -> Vite Env
    if (typeof window !== 'undefined' && (window as any).electronAPI?.env) {
        return (window as any).electronAPI.env[key];
    }
    return import.meta.env[key];
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || '';

if (typeof window !== 'undefined') {
    console.log(`[Supabase] 📡 Initializing Client in Renderer...`);
    console.log(`[Supabase] URL Resolver: ${supabaseUrl ? 'VALID ✓' : 'MISSING ✗'}`);
    if (supabaseUrl) {
        console.log(`[Supabase] URL: ${supabaseUrl}`);
    }
    if (supabaseAnonKey) {
        console.log(`[Supabase] Key present (len: ${supabaseAnonKey.length})`);
    } else {
        console.warn(`[Supabase] ❌ Anon Key is MISSING! Check .env and Electron Bridge.`);
    }
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase credentials! Cloud features will be disabled.');
}

// [FIX] Custom fetch wrapper with extended timeout for Electron
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
    // Use a generous 60s timeout instead of Supabase default
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const fetchOptions: RequestInit = {
        ...options,
        signal: controller.signal
    };

    return fetch(url, fetchOptions).finally(() => clearTimeout(timeout));
};

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
    global: {
        fetch: customFetch
    }
});

// [DEBUG] Expose to window for console diagnostics
if (typeof window !== 'undefined') {
    (window as any).supabase = supabase;
}
