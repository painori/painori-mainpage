import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy loading pages
const Home = lazy(() => import('./pages/Home'));
const DevStory = lazy(() => import('./pages/DevStory'));
const Lounge = lazy(() => import('./pages/Lounge'));
const Ranking = lazy(() => import('./pages/Ranking'));
const News = lazy(() => import('./pages/News'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-orange-500">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dev-story" element={<DevStory />} />
            <Route path="lounge" element={<Lounge />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="news" element={<News />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
