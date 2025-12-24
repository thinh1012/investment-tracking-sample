import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { encryptData, decryptData } from '../utils/crypto';

export const useCloudSync = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [syncKey, setSyncKey] = useState<string>(() => sessionStorage.getItem('vault_sync_key') || '');
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('investment_tracker_last_sync'));
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
        setStatus("Syncing to Cloud...");
        setError(null);

        try {
            const encryptedBlob = await encryptData(data, key);
            const { error } = await supabase
                .from('user_vaults')
                .upsert({
                    user_id: user.id,
                    encrypted_data: encryptedBlob,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            if (providedKey) setSyncKey(providedKey);
            const now = new Date().toISOString();
            setLastSyncTime(now);
            localStorage.setItem('investment_tracker_last_sync', now);
            setStatus("✅ Cloud Updated!");
            setTimeout(() => setStatus(''), 2000);
        } catch (e: any) {
            setError("Sync Failed. Please check your connection.");
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
        if (!user) return null;
        if (!key) return null;

        setIsLoading(true);
        setStatus("Fetching Cloud Data...");
        setError(null);

        try {
            const { data, error } = await supabase
                .from('user_vaults')
                .select('encrypted_data')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows'
            if (!data?.encrypted_data) {
                setStatus("Cloud vault is empty.");
                setTimeout(() => setStatus(''), 2000);
                return null;
            }

            const decryptedData = await decryptData(data.encrypted_data, key);
            const now = new Date().toISOString();
            setLastSyncTime(now);
            localStorage.setItem('investment_tracker_last_sync', now);
            if (providedKey) setSyncKey(providedKey);
            setStatus("✅ Data Restored!");
            setTimeout(() => setStatus(''), 2000);
            return decryptedData;

        } catch (e: any) {
            setError("Restore Failed: " + (e.message.includes('JSON') ? "Wrong Sync Password" : "Unknown Error"));
            return null;
        } finally {
            setIsLoading(false);
        }
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
