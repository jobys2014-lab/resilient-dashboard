import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

const UnusualActivity = ({ marketData, alerts = [] }) => {
  const navigate = useNavigate();
  const alertSymbols = alerts.map(a => a.symbol);
  const unusualStocks = marketData.filter(d => parseFloat(d.volumeBurst) > 2.0 || alertSymbols.includes(d.symbol));
  
  const topSignalsData = unusualStocks.filter(d => alertSymbols.includes(d.symbol) && !d.symbol.includes('NIFTY') && !d.symbol.includes('BANK'));
  const indicesData = unusualStocks.filter(d => d.symbol.includes('NIFTY') || d.symbol.includes('BANK'));
  const stocksData = unusualStocks.filter(d => !d.symbol.includes('NIFTY') && !d.symbol.includes('BANK'));

  const renderSection = (title, data) => {
    if (data.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-300 border-b border-slate-700 pb-2 mb-4">{title} <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded ml-2">{data.length}</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.map((stock, idx) => {
            const matchedAlert = alerts.find(a => a.symbol === stock.symbol);
            return (
            <div 
              key={idx} 
              onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}`)}
              className={`bg-slate-800 border ${matchedAlert ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'border-slate-700'} p-4 rounded-lg flex flex-col gap-3 hover:border-blue-500/50 transition-colors shadow-lg overflow-hidden relative cursor-pointer group`}
            >
              <div className="flex justify-between items-center border-b border-slate-700 pb-2 gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-bold text-lg text-slate-200 truncate">{stock.symbol.split('-')[0].replace('NSE:', '')}</span>
                  {matchedAlert && (
                    <span className="bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                      {matchedAlert.status}
                    </span>
                  )}
                </div>
                <span className="bg-blue-500/20 text-blue-400 text-[10px] md:text-xs font-bold px-2 py-1 rounded border border-blue-500/20 whitespace-nowrap shrink-0">
                  {stock.volumeBurst}x VOL
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mt-1">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Current Price</p>
                  <p className="font-mono text-slate-200">{stock.currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">VWAP Status</p>
                  <p className={`font-mono font-bold ${stock.currentPrice > stock.indicators?.vwapVal ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.currentPrice > stock.indicators?.vwapVal ? 'ABOVE VWAP' : 'BELOW VWAP'}
                  </p>
                </div>
                <div className="col-span-2 mt-2">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Contract</p>
                      <p className="font-mono text-yellow-400 font-bold text-xs mt-0.5">ATM CE / FUT</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Smart Money</p>
                      <p className={`font-bold text-xs mt-0.5 ${stock.buyProbability > 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.buyProbability > 50 ? 'LONG BUILDUP' : 'SHORT BUILDUP'}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Open Interest (OI) Built</p>
                    <p className={`font-mono font-bold text-[10px] ${(parseFloat(stock.oiChangePercent) || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(parseFloat(stock.oiChangePercent) || 0) > 0 ? '+' : ''}{(parseFloat(stock.oiChangePercent) || 0).toFixed(2)}%
                    </p>
                  </div>
                  {/* Horizontal OI Bar Chart */}
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700 relative">
                    <div 
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${(parseFloat(stock.oiChangePercent) || 0) > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}
                      style={{ width: `${Math.min(Math.abs(parseFloat(stock.oiChangePercent) || 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
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
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
            <Activity className="text-blue-400" size={28} />
            Unusual Options & Futures Activity
          </h2>
          <p className="text-sm text-slate-400 mt-1">Scanning ATM Options and Futures of high-value Nifty 100 stocks for massive institutional volume spikes.</p>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-300 border border-slate-700">
          Scanning {marketData.length * 2} contracts
        </div>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Side: Stocks */}
        <div className="flex-1 border-r border-slate-800 pr-0 xl:pr-8">
          <h2 className="text-xl font-black text-blue-400 mb-6 uppercase tracking-wider">🏢 Equities / Stocks</h2>
          {renderSection("🔥 Live Top Signals", topSignalsData)}
          {renderSection("🏢 All Stocks", stocksData)}
        </div>
        
        {/* Right Side: Indices */}
        <div className="flex-1">
          <h2 className="text-xl font-black text-fuchsia-400 mb-6 uppercase tracking-wider">📊 Market Indices</h2>
          {renderSection("Indices", indicesData)}
        </div>
      </div>
      
      {unusualStocks.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          No unusual activity detected at the moment.
        </div>
      )}
    </div>
  );
};

export default UnusualActivity;
