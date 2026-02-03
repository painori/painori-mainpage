import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap, PlayCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNews } from '../hooks/useNews';

// Import Assets
import heroAppImage from '../assets/images/splash_owl.png';
import featureExploreImage from '../assets/images/spotgo_0.png';
import featureOwnImage from '../assets/images/spotgo_1.png';
import featureEnjoyImage from '../assets/images/spotgo_6.png';

const contourPattern = "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E";

const FeatureCard = ({ image, title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="relative group rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all border border-gray-100"
    >
        <div className="aspect-[4/5] overflow-hidden bg-gray-100 relative">
            <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">{title}</h3>
                <p className="text-gray-200 font-medium text-sm md:text-base">{desc}</p>
            </div>
        </div>
    </motion.div>
);

const LiveTicker = ({ t }) => {
    const [count, setCount] = useState(0);
    const target = 11886;

    useEffect(() => {
        let start = 0;
        const duration = 2500;
        const increment = target / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center justify-center gap-2 md:gap-3 bg-white/80 px-3 py-2 md:px-5 md:py-3 rounded-full border border-orange-100 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-orange-500"></span>
            </span>
            <span className="text-xs md:text-sm font-medium text-gray-600 whitespace-nowrap">
                {t('live_ticker_prefix')} <span className="font-bold text-orange-600 font-mono text-sm md:text-lg">{count.toLocaleString()}</span> {t('live_ticker_suffix')}
            </span>
        </div>
    );
};

const Home = () => {
    const { t } = useTranslation();
    const { fetchNews, loading } = useNews();
    const [latestNews, setLatestNews] = useState([]);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, -50]);

    useEffect(() => {
        const loadNews = async () => {
            const news = await fetchNews('pi');
            if (news) {
                setLatestNews(news.slice(0, 3));
            }
        };
        loadNews();
    }, [fetchNews]);

    return (
        <div className="bg-white text-gray-900 font-sans relative">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{ backgroundImage: `url("${contourPattern}")` }}
            ></div>

            {/* Hero Section */}
            <section className="relative min-h-[auto] md:min-h-[90vh] flex items-center pt-8 pb-12 md:pt-20 md:pb-0 overflow-hidden">
                <div className="container mx-auto px-4 z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <div className="flex-1 text-center md:text-left space-y-6 md:space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="mb-4 md:mb-8 inline-block max-w-full">
                                    <LiveTicker t={t} />
                                </div>

                                <h1 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight tracking-tight whitespace-pre-line">
                                    {t('hero_title')}
                                </h1>
                                <p className="text-base md:text-lg text-gray-500 mb-8 md:mb-10 max-w-xl mx-auto md:mx-0 font-medium leading-relaxed">
                                    {t('hero_subtitle')}
                                </p>
                                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 justify-center md:justify-start">
                                    <a
                                        href="https://spot.painori.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 md:px-8 md:py-4 bg-orange-500 text-white rounded-2xl font-bold text-base md:text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 transform hover:-translate-y-1"
                                    >
                                        <Zap size={18} />
                                        {t('hero_cta', 'Start SPOT GO')}
                                    </a>

                                    {/* Helper Text for CTA instead of a button */}
                                    <div className="flex items-center gap-2 text-gray-500 font-medium animate-pulse">
                                        <ArrowRight size={14} className="text-orange-400" />
                                        <span className="text-xs md:text-sm">{t('hero_demo_helper', 'No download required')}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex-1 w-full max-w-[320px] md:max-w-full flex justify-center perspective-1000 mt-8 md:mt-0">
                            {/* Hero Image - Floating Owl (Cropped Height) */}
                            <motion.div
                                style={{ y: y1 }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="relative w-[240px] md:w-[420px] aspect-[4/5.5] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20"
                            >
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                                <img
                                    src={heroAppImage}
                                    alt="Spot Go Owl"
                                    className="w-full h-full object-cover object-top z-10 animate-float"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3-Step Features Section (Explore -> Own -> Enjoy) */}
            <section className="py-12 md:py-24 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10 md:mb-16">
                        <span className="text-orange-500 font-bold uppercase tracking-wider text-xs md:text-sm mb-2 block">{t('how_it_works')}</span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('main_feature_title')}</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-12">
                        <FeatureCard
                            image={featureExploreImage}
                            title={t('feature_explore_title')}
                            desc={t('feature_explore_desc')}
                            delay={0.1}
                        />
                        <FeatureCard
                            image={featureOwnImage}
                            title={t('feature_own_title')}
                            desc={t('feature_own_desc')}
                            delay={0.2}
                        />
                        <FeatureCard
                            image={featureEnjoyImage}
                            title={t('feature_enjoy_title')}
                            desc={t('feature_enjoy_desc')}
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* Community Feed / Latest Updates */}
            <section className="py-16 md:py-24 bg-gray-50/50 border-t border-gray-100 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-end mb-8 md:mb-12">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-gray-900">{t('trend_title')}</h2>
                            <p className="text-gray-500 text-sm md:text-lg">{t('trend_desc')}</p>
                        </div>
                        <Link to="/lounge" className="hidden md:flex items-center gap-2 text-orange-600 font-bold hover:text-orange-700 transition-colors">
                            {t('enter_lounge')} <ArrowRight size={20} />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* News Placeholders / Real Data */}
                        {loading.pi ? (
                            [1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-3xl animate-pulse"></div>)
                        ) : (
                            latestNews.map((news, idx) => (
                                <a
                                    key={idx}
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">📢</div>
                                        <div>
                                            <div className="text-xs font-bold text-orange-500 uppercase">Announcement</div>
                                            <div className="text-xs text-gray-400">Pi Network Official</div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-3 text-lg line-clamp-2 group-hover:text-orange-600 transition-colors">
                                        {news.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                                        {news.preview}
                                    </p>
                                    <div className="text-xs text-gray-400 font-medium">
                                        {new Date(news.pubDate).toLocaleDateString()}
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                    <div className="mt-8 text-center md:hidden">
                        <Link to="/lounge" className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-700 transition-colors">
                            {t('enter_lounge')} <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
