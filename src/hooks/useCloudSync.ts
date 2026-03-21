import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { encryptData, decryptData } from '../utils/crypto';

export const useCloudSync = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [syncKey, setSyncKey] = useState<string>(() => sessionStorage.getItem('vault_sync_key') || '');
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('vault_last_sync_time'));
    const [isCloudNewer, setIsCloudNewer] = useState(false);

    // Check auth state on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Session Persistence
    useEffect(() => {
        if (syncKey) {
            sessionStorage.setItem('vault_sync_key', syncKey);
        } else {
            sessionStorage.removeItem('vault_sync_key');
        }
    }, [syncKey]);

    // Auth Methods (Memoized)
    const signUp = useCallback(async (email: string, pass: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signUp({ email, password: pass });
            if (error) throw error;
            setStatus('Check your email to confirm!');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signIn = useCallback(async (email: string, pass: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) throw error;
            setStatus('Logged in! Fetching data...');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setSyncKey('');
        setStatus('');
        setError(null);
    }, []);

    // The "Vault" Logic
    const uploadVault = useCallback(async (
        data: any,
        providedKey?: string,
        force: boolean = false
    ) => {
        const key = providedKey || syncKey;
        if (!user) {
            setError("You must be logged in to sync.");
            return;
        }
        if (!key) {
            setError("Sync Password required.");
            return;
        }

        // Safety Gate: Prevent overwriting a populated vault with empty data unless forced
        try {
            const hasData = data.transactions?.length > 0 || data.watchlist?.length > 0 || data.marketPicks?.length > 0;
            if (!hasData && !force) {
                // Check if a cloud vault already exists
                const { data: existing } = await supabase
                    .from('user_vaults')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (existing) {
                    throw new Error("EMPTY_DATA_PROTECTION");
                }
            }
        } catch (gateError: any) {
            if (gateError.message === "EMPTY_DATA_PROTECTION") {
                setError("Safety Gate: Your local data is empty. Uploading now would wipe your cloud vault. Download first or add data locally.");
                return;
            }
        }

        setIsLoading(true);
        setStatus("📦 Gathering data...");
        setError(null);

        try {
            console.log("[SYNC] Step 1: Preparing for encryption. Data keys:", Object.keys(data));
            console.log("[SYNC] Payload preview (counts):", {
                tx: data.transactions?.length,
                wl: data.watchlist?.length,
                picks: data.marketPicks?.length
            });

            // Give UI a chance to render the gathering status
            await new Promise(r => setTimeout(r, 100));

            setStatus("🔐 Encrypting vault...");
            console.log("[SYNC] Step 2: Starting encryption...");
            const encStartTime = performance.now();
            const encryptedBlob = await encryptData(data, key);
            console.log(`[SYNC] Encryption took ${(performance.now() - encStartTime).toFixed(0)}ms. Blob size: ${encryptedBlob.length} chars`);

            setStatus("🚀 Uploading to Cloud...");
            console.log("[SYNC] Step 3: Upsert to Supabase user_vaults...");
            const uploadStartTime = performance.now();
            const { error: supabaseError } = await supabase
                .from('user_vaults')
                .upsert({
                    user_id: user.id,
                    encrypted_data: encryptedBlob,
                    updated_at: new Date().toISOString()
                });

            console.log(`[SYNC] Supabase upsert took ${(performance.now() - uploadStartTime).toFixed(0)}ms.`);

            if (supabaseError) {
                console.error("[SYNC] Supabase returned an error:", supabaseError);
                throw supabaseError;
            }

            if (providedKey) setSyncKey(providedKey);
            const now = Date.now().toString();
            setLastSyncTime(now);
            localStorage.setItem('vault_last_sync_time', now);

            // Dispatch event for Dashboard UI
            window.dispatchEvent(new CustomEvent('cloud_sync_complete', {
                detail: { timestamp: Number(now) }
            }));

            console.log("[SYNC] ✅ Sync complete at", new Date().toLocaleTimeString());
            setStatus("✅ Cloud Updated!");
            setTimeout(() => setStatus(''), 3000);
        } catch (e: any) {
            console.error("[useCloudSync] FULL ERROR OBJECT:", e);
            console.error("[useCloudSync] Error type:", e?.name || 'unknown');
            console.error("[useCloudSync] Error message:", e?.message || 'no message');
            setError(e?.message || e?.toString() || "Sync Failed. Unknown error.");
            setStatus("");
        } finally {
            setIsLoading(false);
        }
    }, [user, syncKey]);

    const inspectVault = useCallback(async (providedKey?: string) => {
        const key = providedKey || syncKey;
        if (!user || !key) return null;

        try {
            const { data, error } = await supabase
                .from('user_vaults')
                .select('encrypted_data, updated_at')
                .eq('user_id', user.id)
                .single();

            if (error || !data?.encrypted_data) return null;

            const decryptedData = await decryptData(data.encrypted_data, key);
            return {
                updated_at: data.updated_at,
                transactionCount: decryptedData.transactions?.length || 0,
                watchlistCount: decryptedData.watchlist?.length || 0,
                picksCount: decryptedData.marketPicks?.length || 0,
                isLegacy: !decryptedData.version
            };
        } catch (e) {
            return null;
        }
    }, [user, syncKey]);

    const downloadVault = useCallback(async (providedKey?: string) => {
        const key = providedKey || syncKey;
        if (!user || !key) return null;

        setIsLoading(true);
        setStatus("📡 Connecting to Vault...");
        setError(null);

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`[CLOUD_SYNC] 📡 Connecting to Vault for download (Attempt ${attempts})...`);
                console.log(`[CLOUD_SYNC] Target User ID: ${user.id}`);

                const queryStartTime = performance.now();

                // Fetch the vault data directly using the user ID from state
                const { data, error: supabaseError } = await supabase
                    .from('user_vaults')
                    .select('encrypted_data')
                    .eq('user_id', user.id)
                    .single();

                const duration = (performance.now() - queryStartTime).toFixed(0);
                console.log(`[CLOUD_SYNC] Query finished in ${duration}ms`);

                if (supabaseError) {
                    console.error("[useCloudSync] Supabase Error:", supabaseError);
                    // PGRST116 is "No rows found" for .single()
                    if (supabaseError.code === 'PGRST116') {
                        setStatus("Cloud vault is empty.");
                        setTimeout(() => setStatus(''), 2000);
                        return null;
                    }
                    throw supabaseError;
                }

                if (!data?.encrypted_data) {
                    setStatus("Cloud vault contains no data blob.");
                    setTimeout(() => setStatus(''), 2000);
                    return null;
                }

                setStatus("🔐 Decrypting data...");
                await new Promise(r => setTimeout(r, 100));

                const decryptedData = await decryptData(data.encrypted_data, key);

                const now = Date.now().toString();
                setLastSyncTime(now);
                localStorage.setItem('vault_last_sync_time', now);
                if (providedKey) setSyncKey(providedKey);

                // Dispatch event for Dashboard UI
                window.dispatchEvent(new CustomEvent('cloud_sync_complete', {
                    detail: { timestamp: Number(now) }
                }));

                setStatus("✅ Data Restored!");
                setTimeout(() => setStatus(''), 3000);
                return decryptedData;

            } catch (e: any) {
                const errorDetails = {
                    name: e?.name,
                    message: e?.message,
                    code: e?.code,
                    stack: e?.stack,
                    type: typeof e
                };
                console.error(`[useCloudSync] Download Attempt ${attempts} Failed: ${JSON.stringify(errorDetails)}`);

                const isAbort = e.name === 'AbortError' || e.message?.includes('aborted');

                if (isAbort && attempts < maxAttempts) {
                    setStatus(`Retrying (${attempts}/${maxAttempts})...`);
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }

                if (isAbort) {
                    setError("Restore Failed: Connection timed out. Please check your internet or try again later.");
                } else if (e.message.includes('JSON') || e.message.includes('Decryption') || e.message.includes('password')) {
                    setError("Restore Failed: Wrong Sync Password");
                } else {
                    setError(`Restore Failed: ${e.message || "Unknown Network Error"}`);
                }

                setStatus("");
                break;
            }
        }
        setIsLoading(false);
        return null;
    }, [user, syncKey]);

    // Auto-Download on Login
    useEffect(() => {
        if (user && syncKey && !isLoading) {
            // We can't auto-download safely without knowing if local is newer
            // For now, only auto-download if we just signed in (checked via status)
            if (status.includes('Logged in')) {
                downloadVault().then(data => {
                    if (data) {
                        // Notify system that cloud data is ready for hydration
                        window.dispatchEvent(new CustomEvent('cloud-vault-downloaded', { detail: data }));
                    }
                });
            }
        }
    }, [user, syncKey]);

    return {
        user,
        isLoading,
        error,
        status,
        syncKey,
        setSyncKey,
        signUp,
        signIn,
        signOut,
        lastSyncTime,
        uploadVault,
        downloadVault,
        inspectVault,
        isCloudNewer,
        checkSyncStatus: useCallback(async () => {
            if (!user || !syncKey) return false;
            try {
                const { data, error } = await supabase
                    .from('user_vaults')
                    .select('updated_at')
                    .eq('user_id', user.id)
                    .single();

                if (error || !data) return false;

                const cloudDate = new Date(data.updated_at).getTime();
                const localDate = lastSyncTime ? new Date(lastSyncTime).getTime() : 0;

                // If cloud is more than 5 seconds newer than local, mark as "new data available"
                if (cloudDate > localDate + 5000) {
                    setIsCloudNewer(true);
                    return true;
                }
                setIsCloudNewer(false);
                return false;
            } catch (e) {
                return false;
            }
        }, [user, syncKey, lastSyncTime])
    };
};
