import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { encryptData, decryptData } from '../utils/crypto';
import { Asset, Transaction } from '../types';

export const useCloudSync = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');

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

    // Auth Methods
    const signUp = async (email: string, pass: string) => {
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
    };

    const signIn = async (email: string, pass: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) throw error;
            setStatus('Logged in successfully');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setStatus('');
        setError(null);
    };

    // The "Vault" Logic
    const uploadVault = async (
        syncPassword: string,
        data: any
    ) => {
        if (!user) {
            setError("You must be logged in to sync.");
            return;
        }
        setIsLoading(true);
        setStatus("Encrypting data...");
        setError(null);

        try {
            // 1. Encrypt locally
            const encryptedBlob = await encryptData(data, syncPassword);

            setStatus("Uploading to Vault...");

            // 2. Upsert to Supabase
            const { error } = await supabase
                .from('user_vaults')
                .upsert({
                    user_id: user.id,
                    encrypted_data: encryptedBlob,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setStatus("✅ Synced Successfully!");
            setTimeout(() => setStatus(''), 3000);
        } catch (e: any) {
            console.error(e);
            setError("Sync Failed: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadVault = async (syncPassword: string) => {
        if (!user) {
            setError("You must be logged in to sync.");
            return null;
        }
        setIsLoading(true);
        setStatus("Downloading from Vault...");
        setError(null);

        try {
            // 1. Get Blob
            const { data, error } = await supabase
                .from('user_vaults')
                .select('encrypted_data')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            if (!data?.encrypted_data) throw new Error("Vault is empty.");

            setStatus("Decrypting...");

            // 2. Decrypt locally
            const decryptedData = await decryptData(data.encrypted_data, syncPassword);

            setStatus("✅ Data Restored!");
            setTimeout(() => setStatus(''), 3000);
            return decryptedData;

        } catch (e: any) {
            console.error(e);
            if (e.message.includes('JSON')) {
                setError("Wrong Password! Decryption failed.");
            } else {
                setError("Restore Failed: " + e.message);
            }
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        user,
        isLoading,
        error,
        status,
        signUp,
        signIn,
        signOut,
        uploadVault,
        downloadVault
    };
};
