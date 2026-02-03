import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Cpu, Globe, DollarSign, BarChart3, User, Database, Code, Zap, Bot, ArrowRight } from 'lucide-react';

// Import Assets
import profileImg from '../assets/images/profile_architect.png';
import archImg from '../assets/images/spotgo_0.png';
import shopImg from '../assets/images/spotgo_5.png';
import globalImg from '../assets/images/uploaded_media_2_1770037865731.png';

const BentoBox = ({ className, children, onClick, delay = 0, bgImage }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay }}
        onClick={onClick}
        className={`relative overflow-hidden bg-navy-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 cursor-pointer group hover:border-white/30 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-500/10 ${className}`}
    >
        {/* Background Image Effect */}
        {bgImage && (
            <div className="absolute inset-0 z-0 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-700 ease-out">
                <img src={bgImage} alt="" className="w-full h-full object-cover" />
            </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent z-10" />

        <div className="relative z-20 h-full flex flex-col justify-between">
            {children}
        </div>
    </motion.div>
);

const DetailModal = ({ isOpen, onClose, content }) => {
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-navy-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    {content}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const DevStory = () => {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState(null);

    const bentoItems = [
        {
            id: 'profile',
            colSpan: 'col-span-12 md:col-span-4',
            rowSpan: 'row-span-2',
            icon: User,
            title: t('dev_profile_title'),
            desc: t('dev_profile_desc'),
            color: "text-orange-400",
            bgContent: (
                <div className="absolute right-0 bottom-0 w-48 h-48 opacity-90">
                    <img src={profileImg} alt="Architect" className="w-full h-full object-contain" />
                </div>
            ),
            content: (
                <div className="space-y-6">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500 shadow-lg shadow-orange-500/20">
                            <img src={profileImg} alt="Architect" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">{t('dev_profile_title')}</h2>
                            <p className="text-gray-400 font-medium">Solo PM & Orchestrator</p>
                        </div>
                    </div>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        {t('dev_profile_desc')}
                    </p>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">{t('dev_competencies')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {[t('dev_comp_planning'), t('dev_comp_ai'), t('dev_comp_arch'), t('dev_comp_data')].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-sm border border-orange-500/20">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'tech',
            colSpan: 'col-span-12 md:col-span-8',
            rowSpan: 'row-span-1',
            icon: Cpu,
            title: t('dev_tech_title'),
            desc: t('dev_tech_desc'),
            color: "text-cyan-400",
            content: (
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white mb-4">{t('dev_tech_title')}</h2>
                    <p className="text-gray-300 text-lg mb-6">{t('dev_tech_desc')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Code size={24} /></div>
                            <div><strong className="text-white block">Cursor</strong><span className="text-xs text-gray-400">{t('dev_tech_cursor_desc')}</span></div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                            <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><Bot size={24} /></div>
                            <div><strong className="text-white block">{t('dev_tech_models')}</strong><span className="text-xs text-gray-400">{t('dev_tech_models_desc')}</span></div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Zap size={24} /></div>
                            <div><strong className="text-white block">Antigravity</strong><span className="text-xs text-gray-400">{t('dev_tech_antigravity_desc')}</span></div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'cost',
            colSpan: 'col-span-12 md:col-span-4',
            rowSpan: 'row-span-1',
            icon: HelperIcon,
            title: t('dev_cost_title'),
            desc: t('dev_cost_desc'),
            color: "text-green-400",
            bgImage: archImg,
            content: (
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white mb-2">{t('dev_cost_title')}</h2>
                    <p className="text-gray-300 text-lg">{t('dev_cost_desc')}</p>
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <h3 className="text-green-400 font-bold mb-1">{t('dev_cost_detail_title')}</h3>
                        <p className="text-sm text-green-200">{t('dev_cost_detail_desc')}</p>
                    </div>
                </div>
            )
        },
        {
            id: 'economy',
            colSpan: 'col-span-12 md:col-span-4',
            rowSpan: 'row-span-1',
            icon: BarChart3,
            title: t('dev_economy_title'),
            desc: t('dev_economy_desc'),
            color: "text-purple-400",
            bgImage: shopImg,
            content: (
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white mb-2">{t('dev_economy_title')}</h2>
                    <p className="text-gray-300 text-lg">{t('dev_economy_desc')}</p>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-center">
                            <div className="text-blue-400 font-bold text-xl">Earn</div>
                            <div className="text-xs text-gray-400">Play</div>
                        </div>
                        <ArrowRight className="text-gray-600" />
                        <div className="text-center">
                            <div className="text-red-400 font-bold text-xl">Burn</div>
                            <div className="text-xs text-gray-400">Item/Territory</div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'global',
            colSpan: 'col-span-12 md:col-span-4',
            rowSpan: 'row-span-1',
            icon: Globe,
            title: t('dev_global_title'),
            desc: t('dev_global_desc'),
            color: "text-cyan-400",
            bgImage: globalImg,
            content: (
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white mb-2">{t('dev_global_title')}</h2>
                    <p className="text-gray-300 text-lg">{t('dev_global_desc')}</p>
                    <p className="text-gray-300">
                        {t('dev_global_detail')}
                    </p>
                </div>
            )
        },
    ];

    const selectedItem = bentoItems.find(item => item.id === selectedId);

    return (
        <div className="min-h-screen bg-navy-900 text-white p-4 md:p-6 flex flex-col items-center font-sans selection:bg-cyan-500/30">
            <div className="max-w-7xl w-full flex-1 flex flex-col justify-center">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4 border-b border-white/5 pb-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-1">
                            {t('dev_story_title')}
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg">
                            {t('dev_story_subtitle')}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <div className="px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs md:text-sm font-medium">#TheBlueprint</div>
                        <div className="px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs md:text-sm font-medium">#Architect</div>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-12 gap-3 md:gap-4 auto-rows-[minmax(160px,auto)] md:auto-rows-[200px]">
                    {bentoItems.map((item, index) => (
                        <BentoBox
                            key={item.id}
                            className={`${item.colSpan} ${item.rowSpan} p-5`}
                            onClick={() => setSelectedId(item.id)}
                            delay={index * 0.1}
                            bgImage={item.bgImage}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-white/10 backdrop-blur-sm ${item.color}`}>
                                    <item.icon size={24} />
                                </div>
                                <div className="p-2 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight size={16} className="text-white" />
                                </div>
                            </div>

                            {item.bgContent}

                            <div className="mt-auto relative z-10">
                                <h3 className="text-lg md:text-2xl font-bold mb-1 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">{item.title}</h3>
                                <p className="text-gray-400 font-medium text-xs md:text-base group-hover:text-cyan-200 transition-colors">{item.desc}</p>
                            </div>
                        </BentoBox>
                    ))}
                </div>


            </div>

            {/* Modal */}
            <DetailModal
                isOpen={!!selectedId}
                onClose={() => setSelectedId(null)}
                content={selectedItem?.content}
            />
        </div>
    );
};

// Helper Icon for readability
const HelperIcon = ({ size, className }) => <Database size={size} className={className} />;

export default DevStory;
