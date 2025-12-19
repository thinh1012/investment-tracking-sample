import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { encryptData, decryptData } from '../utils/crypto';

export const useCloudSync = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [syncKey, setSyncKey] = useState<string>(() => sessionStorage.getItem('vault_sync_key') || '');

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
        providedKey?: string
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
            setStatus("✅ Cloud Updated!");
            setTimeout(() => setStatus(''), 2000);
        } catch (e: any) {
            console.error(e);
            setError("Sync Failed: " + e.message);
        } finally {
            setIsLoading(false);
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
            if (providedKey) setSyncKey(providedKey);
            setStatus("✅ Data Restored!");
            setTimeout(() => setStatus(''), 2000);
            return decryptedData;

        } catch (e: any) {
            console.error(e);
            setError("Restore Failed: " + (e.message.includes('JSON') ? "Wrong Sync Password" : e.message));
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
        uploadVault,
        downloadVault
    };
};
