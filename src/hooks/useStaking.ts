import { useState, useEffect, useCallback } from 'react';
import { StakingPosition } from '../types';
import { supabase } from '../services/supabase';

const LS_KEY = 'investment_tracker_staking';

const loadFromStorage = (): StakingPosition[] => {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveToStorage = (positions: StakingPosition[]) => {
    localStorage.setItem(LS_KEY, JSON.stringify(positions));
};

export const useStaking = () => {
    const [positions, setPositions] = useState<StakingPosition[]>(loadFromStorage);
    const [syncing, setSyncing] = useState(false);

    // On mount, sync from Supabase
    useEffect(() => {
        const fetchFromSupabase = async () => {
            const { data, error } = await supabase
                .from('staking_positions')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data && data.length > 0) {
                setPositions(data as StakingPosition[]);
                saveToStorage(data as StakingPosition[]);
            }
        };
        fetchFromSupabase();
    }, []);

    const addPosition = useCallback(async (pos: Omit<StakingPosition, 'id' | 'created_at'>) => {
        setSyncing(true);
        const { data, error } = await supabase
            .from('staking_positions')
            .insert([pos])
            .select()
            .single();
        if (!error && data) {
            setPositions(prev => {
                const next = [data as StakingPosition, ...prev];
                saveToStorage(next);
                return next;
            });
        }
        setSyncing(false);
    }, []);

    const deletePosition = useCallback(async (id: string) => {
        setSyncing(true);
        await supabase.from('staking_positions').delete().eq('id', id);
        setPositions(prev => {
            const next = prev.filter(p => p.id !== id);
            saveToStorage(next);
            return next;
        });
        setSyncing(false);
    }, []);

    const updatePosition = useCallback(async (id: string, updates: Partial<StakingPosition>) => {
        setSyncing(true);
        await supabase.from('staking_positions').update(updates).eq('id', id);
        setPositions(prev => {
            const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
            saveToStorage(next);
            return next;
        });
        setSyncing(false);
    }, []);

    return { positions, addPosition, deletePosition, updatePosition, syncing };
};
