import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Calendar } from 'lucide-react';
import { useVisitorStats } from '../hooks/useVisitorStats';

const VisitorCounter = () => {
    const { t } = useTranslation();
    const { stats, loading } = useVisitorStats();

    if (loading) return null;

    return (
        <div className="text-left py-2">
            <div className="text-[10px] text-gray-500 font-medium leading-tight opacity-80">
                <div>{t('stats_unique_today')} : <span className="font-mono text-gray-400">{stats.today.toLocaleString()}</span></div>
                <div>{t('stats_unique_total')} : <span className="font-mono text-gray-400">{stats.total.toLocaleString()}</span></div>
                <div className="mt-1 text-[9px] text-gray-600 opacity-60">{t('stats_since')} {t('stats_aggregated', '')}</div>
            </div>
        </div>
    );
};

export default VisitorCounter;
