import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer id="contact" className="bg-navy-900 text-gray-300 py-12">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Painori</h2>
                <p className="text-sm text-gray-400 mb-6">Planning with AI Insight NORI</p>

                <div className="flex justify-center items-center space-x-6 mb-6 text-sm">
                    <Link to="/news" className="hover:text-orange-500 transition-colors">News</Link>
                    <span className="text-gray-600">|</span>
                    <a href="/privacy.html" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
                    <span className="text-gray-600">|</span>
                    <a href="/terms.html" className="hover:text-orange-500 transition-colors">Terms of Service</a>
                </div>

                <p className="text-sm mb-2">Contact: <a href="mailto:lukep81@painori.com" className="text-orange-500 hover:underline">lukep81@painori.com</a></p>

                <p className="text-xs text-gray-500 italic mb-4">
                    Built by a solo developer with AI superpowers
                </p>

                <p className="text-xs text-gray-600">
                    © 2025 Painori. All Rights Reserved. Painori is an independently operated third-party project.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
