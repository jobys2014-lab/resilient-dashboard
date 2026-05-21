import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import TimeframeSelector from './components/TimeframeSelector';
import SectorMarquee from './components/SectorMarquee';
import AutoScannerMarquee from './components/AutoScannerMarquee';
import { useMarketData } from './hooks/useMarketData';
import Dashboard from './pages/Dashboard';
import UnusualActivity from './pages/UnusualActivity';
import Heatmap from './pages/Heatmap';
import FullChart from './pages/FullChart';
import AdvancedAnalytics from './pages/AdvancedAnalytics';

const NavLinks = () => {
  const location = useLocation();
  return (
    <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
      <Link to="/" className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${location.pathname === '/' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>
        Terminal
      </Link>
      <Link to="/unusual-activity" className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${location.pathname === '/unusual-activity' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>
        UOA Scanner
      </Link>
      <Link to="/heatmap" className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${location.pathname === '/heatmap' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>
        OI Heatmap
      </Link>
      <Link to="/analytics" className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${location.pathname === '/analytics' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>
        Analytics
      </Link>
    </div>
  );
};

function AppContent() {
  const [timeframe, setTimeframe] = useState("5");
  const { marketData, alerts } = useMarketData();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-white p-2 gap-2 font-sans">
      <header className="flex justify-between items-center bg-slate-900 p-3 rounded-lg shadow-lg border border-slate-800 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-11 h-11 rounded-full border-2 border-yellow-500 object-cover shadow-[0_0_10px_rgba(244,196,48,0.3)]" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-wide">RESILIENT TRADER</h1>
              <p className="text-xs text-gray-400 font-medium">Professional Multi-Chart Dashboard</p>
            </div>
          </div>
          <NavLinks />
        </div>
        
        <div className="flex items-center gap-4">
          <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          
          <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <button 
              onClick={() => window.location.reload()} 
              className="hover:bg-slate-700 p-1.5 rounded-md transition-colors"
              title="Refresh Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21v-5h5" />
              </svg>
            </button>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-xs font-mono font-bold text-slate-300">{time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-[10px] font-bold text-blue-400 tracking-wider">TICK: 1s</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] text-green-400 font-bold tracking-wider uppercase">Live</span>
            </div>
          </div>
        </div>
      </header>

      <SectorMarquee marketData={marketData} />
      <AutoScannerMarquee alerts={alerts} />

      <Routes>
        <Route path="/" element={<Dashboard timeframe={timeframe} marketData={marketData} alerts={alerts} />} />
        <Route path="/unusual-activity" element={<UnusualActivity marketData={marketData} alerts={alerts} />} />
        <Route path="/heatmap" element={<Heatmap marketData={marketData} alerts={alerts} />} />
        <Route path="/analytics" element={<AdvancedAnalytics marketData={marketData} />} />
        <Route path="/chart/:symbol" element={<FullChart marketData={marketData} timeframe={timeframe} />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
