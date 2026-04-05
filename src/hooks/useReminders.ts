import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface TokenReminder {
    id: string;
    token_symbol: string;
    reminder_date: string;
    note: string;
    is_done: boolean;
    created_at?: string;
}

const LS_KEY = 'investment_tracker_reminders';

const loadFromStorage = (): TokenReminder[] => {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveToStorage = (items: TokenReminder[]) => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
};

export const useReminders = () => {
    const [reminders, setReminders] = useState<TokenReminder[]>(loadFromStorage);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            const { data, error } = await supabase
                .from('token_reminders')
                .select('*')
                .order('reminder_date', { ascending: true });
            if (!error && data && data.length > 0) {
                setReminders(data as TokenReminder[]);
                saveToStorage(data as TokenReminder[]);
            }
        };
        fetch();
    }, []);

    const addReminder = useCallback(async (r: Omit<TokenReminder, 'id' | 'created_at' | 'is_done'>) => {
        setSyncing(true);
        const { data, error } = await supabase
            .from('token_reminders')
            .insert([{ ...r, is_done: false }])
            .select()
            .single();
        const item: TokenReminder = (!error && data)
            ? data as TokenReminder
            : { ...r, id: crypto.randomUUID(), is_done: false, created_at: new Date().toISOString() };
        setReminders(prev => {
            const next = [...prev, item].sort(
                (a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
            );
            saveToStorage(next);
            return next;
        });
        setSyncing(false);
    }, []);

    const toggleDone = useCallback(async (id: string, is_done: boolean) => {
        await supabase.from('token_reminders').update({ is_done }).eq('id', id);
        setReminders(prev => {
            const next = prev.map(r => r.id === id ? { ...r, is_done } : r);
            saveToStorage(next);
            return next;
        });
    }, []);

    const deleteReminder = useCallback(async (id: string) => {
        await supabase.from('token_reminders').delete().eq('id', id);
        setReminders(prev => {
            const next = prev.filter(r => r.id !== id);
            saveToStorage(next);
            return next;
        });
    }, []);

    return { reminders, addReminder, toggleDone, deleteReminder, syncing };
};
