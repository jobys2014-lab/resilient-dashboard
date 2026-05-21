import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';

const Heatmap = ({ marketData, alerts = [] }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');

  // Determine state:
  // L = Price > 0, OI > 0 (Green)
  // SC = Price > 0, OI < 0 (Yellow)
  // S = Price < 0, OI > 0 (Red)
  // LU = Price < 0, OI < 0 (Blue)

  const processedData = marketData.map(stock => {
    const pChg = parseFloat(stock.priceChangePercent) || 0;
    const oiChg = parseFloat(stock.oiChangePercent) || 0;
    
    let state = 'L';
    let bgColor = 'bg-green-600';
    let borderColor = 'border-green-500';

    if (pChg >= 0 && oiChg >= 0) {
      state = 'L'; // Long Buildup
      bgColor = 'bg-green-600';
      borderColor = 'border-green-500';
    } else if (pChg >= 0 && oiChg < 0) {
      state = 'SC'; // Short Covering
      bgColor = 'bg-yellow-600 text-yellow-950';
      borderColor = 'border-yellow-500';
    } else if (pChg < 0 && oiChg >= 0) {
      state = 'S'; // Short Buildup
      bgColor = 'bg-red-600';
      borderColor = 'border-red-500';
    } else {
      state = 'LU'; // Long Unwinding
      bgColor = 'bg-blue-600';
      borderColor = 'border-blue-500';
    }

    return { ...stock, state, bgColor, borderColor, pChg, oiChg };
  });

  const filteredData = filter === 'ALL' ? processedData : processedData.filter(d => d.state === filter);

  const alertSymbols = alerts.map(a => a.symbol);
  
  const topSignalsData = filteredData.filter(d => alertSymbols.includes(d.symbol) && !d.symbol.includes('NIFTY') && !d.symbol.includes('BANK'));
  const indicesData = filteredData.filter(d => d.symbol.includes('NIFTY') || d.symbol.includes('BANK'));
  const stocksData = filteredData.filter(d => !d.symbol.includes('NIFTY') && !d.symbol.includes('BANK'));

  const renderGrid = (title, data) => {
    if (data.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-300 border-b border-slate-700 pb-2 mb-4">{title} <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded ml-2">{data.length}</span></h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.map((stock, idx) => {
            const matchedAlert = alerts.find(a => a.symbol === stock.symbol);
            return (
            <div 
              key={idx} 
              onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}`)}
              className={`${stock.bgColor} ${matchedAlert ? 'border-orange-400 border-2 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : stock.borderColor + ' border'} shadow-md p-3 rounded flex flex-col ${stock.state === 'SC' ? 'text-yellow-950' : 'text-white'} transition-transform hover:scale-105 cursor-pointer relative group`}
            >
              {matchedAlert && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10 shadow border border-orange-200">
                  {matchedAlert.status}
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs truncate bg-black/20 px-1.5 py-0.5 rounded">{stock.symbol.split('-')[0].replace('NSE:', '')}</span>
                <span className="text-[9px] font-bold bg-white/20 px-1 rounded">{stock.state}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                <span className="opacity-80 font-semibold">Price</span>
                <span className="text-right font-mono font-bold">{stock.currentPrice.toFixed(2)}</span>
                
                <span className="opacity-80 font-semibold">%Price</span>
                <span className="text-right font-mono font-bold">{stock.pChg > 0 ? '+' : ''}{stock.pChg.toFixed(2)}%</span>
                
                <span className="opacity-80 font-semibold">%OI</span>
                <span className="text-right font-mono font-bold">{stock.oiChg > 0 ? '+' : ''}{stock.oiChg.toFixed(2)}%</span>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
            <Layers className="text-blue-400" size={28} />
            Futures OI Heatmap
          </h2>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded border transition-colors ${filter === 'ALL' ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>All</button>
          <button onClick={() => setFilter('L')} className={`px-4 py-1.5 text-xs font-bold rounded border transition-colors flex items-center gap-2 ${filter === 'L' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}><span className="w-2 h-2 rounded-full bg-green-500"></span>L</button>
          <button onClick={() => setFilter('LU')} className={`px-4 py-1.5 text-xs font-bold rounded border transition-colors flex items-center gap-2 ${filter === 'LU' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}><span className="w-2 h-2 rounded-full bg-blue-500"></span>LU</button>
          <button onClick={() => setFilter('S')} className={`px-4 py-1.5 text-xs font-bold rounded border transition-colors flex items-center gap-2 ${filter === 'S' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}><span className="w-2 h-2 rounded-full bg-red-500"></span>S</button>
          <button onClick={() => setFilter('SC')} className={`px-4 py-1.5 text-xs font-bold rounded border transition-colors flex items-center gap-2 ${filter === 'SC' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}><span className="w-2 h-2 rounded-full bg-yellow-500"></span>SC</button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Stocks */}
        <div className="flex-1 border-r border-slate-800 pr-0 lg:pr-8">
          <h2 className="text-xl font-black text-blue-400 mb-6 uppercase tracking-wider">🏢 Equities / Stocks</h2>
          {renderGrid("🔥 Live Top Signals", topSignalsData)}
          {renderGrid("🏢 All Stocks", stocksData)}
        </div>
        
        {/* Right Side: Indices */}
        <div className="flex-1">
          <h2 className="text-xl font-black text-fuchsia-400 mb-6 uppercase tracking-wider">📊 Market Indices</h2>
          {renderGrid("Indices", indicesData)}
        </div>
      </div>
      
      {filteredData.length === 0 && (
        <div className="text-center py-12 text-slate-500">No stocks matching this criteria.</div>
      )}
    </div>
  );
};

export default Heatmap;
