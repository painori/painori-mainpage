import React from 'react';
import { Trophy } from 'lucide-react';

const Ranking = () => {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center p-8 bg-orange-50 rounded-3xl">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="text-orange-500" size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Ranking</h1>
                <p className="text-gray-500">Coming Soon! Compete with pioneers worldwide.</p>
                <div className="mt-8 text-sm text-gray-400">
                    Current Status: Calculating...
                </div>
            </div>
        </div>
    );
};

export default Ranking;
