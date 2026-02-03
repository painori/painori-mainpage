import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const isDarkTheme = location.pathname === '/dev-story';

    const navItems = [
        { name: 'SPOT GO', path: '/', translationKey: 'nav_spot_go' },
        { name: 'NEWS', path: '/news', translationKey: 'nav_trend' },
        { name: 'LOUNGE', path: '/lounge', translationKey: 'nav_lounge' },
        { name: 'DEV STORY', path: '/dev-story', highlight: true, translationKey: 'nav_dev_story' },
    ];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsMenuOpen(false);
    };

    const textColor = isDarkTheme ? 'text-white' : 'text-gray-600';
    const hoverColor = 'text-orange-500';

    const languages = [
        { code: 'ko', name: '한국어' },
        { code: 'en', name: 'English' },
        { code: 'jp', name: '日本語' },
        { code: 'cn', name: '简体中文' },
        { code: 'tw', name: '繁體中文' },
        { code: 'vn', name: 'Tiếng Việt' },
        { code: 'id', name: 'Bahasa Indonesia' },
        { code: 'my', name: 'Bahasa Melayu' },
        { code: 'th', name: 'ไทย' },
        { code: 'ph', name: 'Filipino' },
        { code: 'in', name: 'हिन्दी' },
        { code: 'pk', name: 'اردو' },
        { code: 'bd', name: 'বাংলা' },
        { code: 'sa', name: 'العربية' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'es', name: 'Español' },
        { code: 'pt', name: 'Português (Brasil)' },
        { code: 'tr', name: 'Türkçe' },
        { code: 'ru', name: 'Русский' },
        { code: 'af', name: 'Afrikaans' },
        { code: 'fi', name: 'Suomi' }
    ];

    const languageMap = [
        { code: 'ko', label: 'KR 한국어' },
        { code: 'en', label: 'US English' },
        { code: 'ja', label: 'JP 日本語' },
        { code: 'zh', label: 'CN 简体中文' },
        { code: 'zh-TW', label: 'TW 繁體中文' },
        { code: 'vi', label: 'VN Tiếng Việt' },
        { code: 'hi', label: 'IN हिन्दी' },
        { code: 'id', label: 'ID Bahasa Indonesia' },
        { code: 'fil', label: 'PH Filipino' },
        { code: 'th', label: 'TH ไทย' },
        { code: 'ms', label: 'MY Bahasa Melayu' },
        { code: 'ar', label: 'SA العربية' },
        { code: 'ur', label: 'PK اردو' },
        { code: 'bn', label: 'BD বাংলা' },
        { code: 'fr', label: 'FR Français' },
        { code: 'de', label: 'DE Deutsch' },
        { code: 'es', label: 'ES Español' },
        { code: 'pt-BR', label: 'BR Português (Brasil)' },
        { code: 'tr', label: 'TR Türkçe' },
        { code: 'af', label: 'ZA Afrikaans' },
        { code: 'fi', label: 'FI Suomi' },
    ];

    return (
        <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${isDarkTheme ? 'bg-navy-900/80 border-navy-800' : 'bg-white/80 border-gray-100'} backdrop-blur-md`}>
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex flex-col">
                        <span className="text-2xl font-bold text-orange-500 tracking-tighter">PAINORI</span>
                        <span className={`text-[10px] ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'} tracking-widest hidden md:block`}>Planning with AI Insight</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <nav className="flex items-center space-x-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`text-sm font-semibold transition-colors duration-200
                    ${item.highlight ? 'text-orange-600 bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100' : `${textColor} hover:${hoverColor}`}
                    ${location.pathname === item.path ? hoverColor : ''}
                  `}
                                >
                                    {t(item.translationKey)}
                                </Link>
                            ))}
                        </nav>

                        {/* Language Selector (Desktop) */}
                        <div className="relative group">
                            <button className={`flex items-center gap-1 text-sm font-medium ${textColor} hover:${hoverColor}`}>
                                <Globe size={16} />
                                <span>{languageMap.find(l => l.code === i18n.language)?.label || 'Language'}</span>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block max-h-80 overflow-y-auto">
                                {languageMap.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 hover:text-orange-500 flex justify-between items-center
                            ${i18n.language === lang.code ? 'text-orange-600 font-bold bg-orange-50/50' : 'text-gray-700'}
                        `}
                                    >
                                        <span>{lang.label}</span>
                                        {i18n.language === lang.code && <span className="text-xs">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className={`md:hidden ${textColor} hover:${hoverColor}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className={`md:hidden py-4 border-t ${isDarkTheme ? 'border-navy-800' : 'border-gray-100'}`}>
                        <div className="flex flex-col space-y-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`text-base font-medium px-2 py-1 rounded
                    ${item.highlight ? 'text-orange-600 bg-orange-50' : textColor}
                  `}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {t(item.translationKey)}
                                </Link>
                            ))}

                            {/* Language Selector (Mobile) */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="text-xs text-gray-400 mb-2 px-2">{t('language_select')}</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {languageMap.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            className={`text-sm text-left px-2 py-1 rounded ${i18n.language === lang.code ? 'text-orange-500 font-bold bg-orange-50' : textColor}`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
