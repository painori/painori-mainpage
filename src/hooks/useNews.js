import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// Simple in-memory cache to avoid redundant calls during session
const newsCache = {
    pi: { data: null, timestamp: 0 },
    crypto: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const useNews = () => {
    const [loading, setLoading] = useState({ pi: false, crypto: false });
    const [error, setError] = useState({ pi: null, crypto: null });

    const fetchNews = useCallback(async (type) => {
        // Check Cache
        const cached = newsCache[type];
        if (cached.data && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        setLoading(prev => ({ ...prev, [type]: true }));
        try {
            const fnName = type === 'pi' ? 'getPiNews' : 'getCryptoNews';
            const fetchFn = httpsCallable(functions, fnName);
            const result = await fetchFn();

            if (result.data && result.data.data) {
                const data = result.data.data;
                // Update Cache
                newsCache[type] = { data, timestamp: Date.now() };
                return data;
            }
            return [];
        } catch (err) {
            console.error(`Error fetching ${type} news:`, err);
            setError(prev => ({ ...prev, [type]: 'Failed to load news.' }));
            return [];
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    }, []);

    return { fetchNews, loading, error };
};
