import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { motion } from 'framer-motion';
import { Newspaper, Rss } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const News = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('pi'); // 'pi' or 'crypto'
    const [newsData, setNewsData] = useState({ pi: [], crypto: [] });
    const [loading, setLoading] = useState({ pi: false, crypto: false });
    const [error, setError] = useState({ pi: null, crypto: null });

    useEffect(() => {
        fetchNews('pi');
        fetchNews('crypto');
    }, []);

    const fetchNews = async (type) => {
        if (newsData[type].length > 0) return; // Cache check (simple)

        setLoading(prev => ({ ...prev, [type]: true }));
        try {
            const fnName = type === 'pi' ? 'getPiNews' : 'getCryptoNews';
            const fetchFn = httpsCallable(functions, fnName);
            const result = await fetchFn();

            if (result.data && result.data.data) {
                setNewsData(prev => ({ ...prev, [type]: result.data.data }));
            }
        } catch (err) {
            console.error(`Error fetching ${type} news:`, err);
            setError(prev => ({ ...prev, [type]: t('news_error', 'Failed to load news.') }));
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    const currentNews = newsData[activeTab];
    const isLoading = loading[activeTab];
    const isError = error[activeTab];

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">{t('news_title', 'Ecosystem News')}</h1>
                    <p className="text-gray-500">{t('news_subtitle', 'Stay updated with Pi Network & Crypto trends')}</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center border-b border-gray-200 mb-8">
                    <button
                        className={`px-6 py-3 font-semibold border-b-2 transition-colors ${activeTab === 'pi' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('pi')}
                    >
                        {t('news_tab_pi', 'Pi Network')}
                    </button>
                    <button
                        className={`px-6 py-3 font-semibold border-b-2 transition-colors ${activeTab === 'crypto' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('crypto')}
                    >
                        {t('news_tab_crypto', 'Crypto News')}
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[300px]">
                    {isLoading && (
                        <div className="text-center py-12 text-gray-400 animate-pulse">
                            {t('news_loading', 'Loading updates...')}
                        </div>
                    )}

                    {isError && !isLoading && (
                        <div className="text-center py-12 text-red-400">
                            {isError}
                        </div>
                    )}

                    {!isLoading && !isError && currentNews.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {t('news_no_news', 'No news available at the moment.')}
                        </div>
                    )}

                    {!isLoading && currentNews.length > 0 && (
                        <div className="grid gap-4">
                            {currentNews.slice(0, 10).map((item, idx) => (
                                <motion.a
                                    key={idx}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="block bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">{item.title}</h3>
                                            <div className="text-xs text-gray-400 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full ${activeTab === 'pi' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {item.source?.name || 'Unknown'}
                                                </span>
                                                <span>•</span>
                                                <span>{t('news_click_to_read', 'Click to read')}</span>
                                            </div>
                                        </div>
                                        <Rss size={16} className="text-gray-300 flex-shrink-0 mt-1" />
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default News;
