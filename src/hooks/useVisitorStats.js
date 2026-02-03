import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const STATS_DOC_ID = 'visitors';
const COLLECTION_NAME = 'stats';

export const useVisitorStats = () => {
    const [stats, setStats] = useState({ total: 0, today: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAndIncrementStats = async () => {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const lastVisit = localStorage.getItem('painori_last_visit');
            const statsRef = doc(db, COLLECTION_NAME, STATS_DOC_ID);

            // 1. Check if we need to increment (Unique Visitor logic)
            if (lastVisit !== today) {
                try {
                    // Try to update existing doc
                    await updateDoc(statsRef, {
                        total: increment(1),
                        [`daily.${today}`]: increment(1)
                    });
                    localStorage.setItem('painori_last_visit', today);
                } catch (error) {
                    // If doc doesn't exist, create it
                    if (error.code === 'not-found') {
                        await setDoc(statsRef, {
                            total: 1,
                            daily: { [today]: 1 }
                        });
                        localStorage.setItem('painori_last_visit', today);
                    } else {
                        console.error("Error updating stats:", error);
                    }
                }
            }

            // 2. Listen for updates (Realtime)
            const unsubscribe = onSnapshot(statsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setStats({
                        total: data.total || 0,
                        today: data.daily?.[today] || 0
                    });
                }
                setLoading(false);
            }, (error) => {
                console.error("Error listening to stats:", error);
                setLoading(false);
            });

            return unsubscribe;
        };

        let unsubscribeFunc;
        checkAndIncrementStats().then(unsub => {
            if (unsub) unsubscribeFunc = unsub;
        });

        return () => {
            if (unsubscribeFunc) unsubscribeFunc();
        };
    }, []);

    return { stats, loading };
};
