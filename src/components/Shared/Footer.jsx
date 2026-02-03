import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VisitorCounter from '../VisitorCounter';

const Footer = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const openLegalModal = async (type) => {
        setModalOpen(true);
        setIsLoading(true);
        const fileName = type === 'privacy' ? '/privacy.html' : '/terms.html';
        const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
        setModalTitle(title);

        try {
            const response = await fetch(fileName);
            const text = await response.text();

            // Extract body content or just use the whole text if simple
            const doc = new DOMParser().parseFromString(text, 'text/html');
            const bodyContent = doc.body.innerHTML;
            setModalContent(bodyContent || text);
        } catch (error) {
            console.error("Failed to load legal document:", error);
            setModalContent('<p>Failed to load content. Please try again later.</p>');
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalContent('');
    };

    return (
        <footer id="contact" className="bg-navy-900 text-gray-300 py-8 border-t border-white/5 relative overflow-hidden">
            <div className="container mx-auto px-4 text-center relative">

                {/* Visitor Counter: Mobile (Stacked) / Desktop (Absolute Left) */}
                <div className="relative mb-6 md:mb-0 md:absolute md:top-0 md:left-0 z-10 flex justify-center md:block">
                    <VisitorCounter />
                </div>

                {/* Main Content */}
                <div className="">
                    <h2 className="text-2xl font-bold text-white mb-2 relative z-0">Painori</h2>
                    <p className="text-xs text-gray-500 mb-6">Planning with AI Insight NORI</p>

                    <div className="flex justify-center items-center space-x-3 mb-6 text-[10px] text-gray-400 flex-wrap gap-y-2">
                        <Link to="/news" className="hover:text-orange-500 transition-colors">News</Link>
                        <span className="text-gray-700">|</span>
                        <button onClick={() => openLegalModal('privacy')} className="hover:text-orange-500 transition-colors">Privacy Policy</button>
                        <span className="text-gray-700">|</span>
                        <button onClick={() => openLegalModal('terms')} className="hover:text-orange-500 transition-colors">Terms of Service</button>
                    </div>

                    <p className="text-xs mb-2 text-gray-500">Contact: <a href="mailto:lukep81@painori.com" className="text-orange-500 hover:underline">lukep81@painori.com</a></p>
                </div>

                <p className="text-xs text-gray-600 italic mb-4">
                    Built by a solo developer with AI superpowers
                </p>

                <p className="text-xs text-gray-600">
                    © 2025 Painori. All Rights Reserved. Painori is an independently operated third-party project.
                </p>
            </div>

            {/* General Legal Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-2xl font-bold text-gray-900">{modalTitle}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-700">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                </div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: modalContent }} />
                            )}
                        </div>

                        <div className="mt-8 pt-4 border-t flex justify-end">
                            <button onClick={closeModal} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
};

export default Footer;
