import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChartWidget from './ChartWidget';

const ChartGrid = ({ timeframe, marketData, alerts = [] }) => {
  const navigate = useNavigate();
  const availableStocks = marketData.filter(d => !d.symbol.includes('NIFTY') && !d.symbol.includes('BANK'));

  // Track which 6 stocks the user wants to see
  const [selections, setSelections] = useState([]);

  useEffect(() => {
    // Maintain chart of all top 6 gainers (Super Stars) continuously (auto-adjust)
    if (availableStocks.length >= 6) {
      const top6 = [...availableStocks]
        .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
        .slice(0, 6)
        .map(s => s.symbol);
      
      // Only update if the top 6 have actually changed to avoid overriding temporary manual views too aggressively
      if (JSON.stringify(selections) !== JSON.stringify(top6)) {
        setSelections(top6);
      }
    } else if (availableStocks.length > 0) {
      const all = availableStocks.map(s => s.symbol);
      if (JSON.stringify(selections) !== JSON.stringify(all)) {
        setSelections(all);
      }
    }
  }, [availableStocks]); // Automatically adjust charts to match Super Stars of the Day

  // Map selections to actual data objects
  const displayedStocks = selections.map((sym, idx) => {
    return availableStocks.find(s => s.symbol === sym) || availableStocks[idx] || null;
  }).filter(Boolean);

  let gridClass = "grid gap-2 flex-1 min-h-0 h-full ";
  if (displayedStocks.length === 1) gridClass += "grid-cols-1";
  else if (displayedStocks.length === 2) gridClass += "grid-cols-1 md:grid-cols-2";
  else if (displayedStocks.length === 3) gridClass += "grid-cols-1 md:grid-cols-3";
  else if (displayedStocks.length === 4) gridClass += "grid-cols-2 md:grid-cols-2";
  else gridClass += "grid-cols-2 md:grid-cols-3"; // 5 or 6 charts

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Dynamic Grid based on number of stocks */}
      <div className={gridClass}>
        {displayedStocks.map((stock, idx) => (
          <div key={`stock-${idx}-${stock.symbol}`} className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex flex-col shadow-sm">
            <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              
              <select 
                className="font-bold text-sm text-slate-200 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded px-2 py-0.5 outline-none focus:border-blue-500 cursor-pointer transition-colors w-24 sm:w-auto truncate"
                value={stock.symbol}
                onChange={(e) => {
                  const newSelections = [...selections];
                  const targetIndex = newSelections.indexOf(stock.symbol);
                  if (targetIndex !== -1) {
                    newSelections[targetIndex] = e.target.value;
                    setSelections(newSelections);
                  }
                }}
              >
                {availableStocks.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol.replace('NSE:', '').replace('-EQ', '')}</option>
                ))}
              </select>
              <div className="flex gap-2 items-center text-[10px] font-bold">
                {stock.buyProbability && <span className="text-green-400 bg-green-900/20 px-1 rounded">BUY {stock.buyProbability}%</span>}
                {stock.sellProbability && <span className="text-red-400 bg-red-900/20 px-1 rounded">SELL {stock.sellProbability}%</span>}
                <span className={`px-2 py-0.5 rounded text-white ${parseFloat(stock.priceChangePercent) >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                  {parseFloat(stock.priceChangePercent) >= 0 ? '+' : ''}{stock.priceChangePercent}%
                </span>
                <span className="text-xs font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded">{timeframe}m</span>
              </div>
            </div>
            <div 
              className="flex-1 min-h-0 relative cursor-pointer group" 
              onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}`)}
              title="Click to view full screen chart"
            >
              <ChartWidget data={stock.history} timeframe={timeframe} orbHigh={stock.orbHigh} orbLow={stock.orbLow} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-blue-500/10 transition-colors pointer-events-none flex items-center justify-center">
                <span className="bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl border border-slate-700">
                  Open Full Chart
                </span>
              </div>
            </div>
            {stock.indicators && (
              <div className="grid grid-cols-5 gap-0.5 bg-slate-950 border-t border-slate-800 p-1 text-[8px] sm:text-[9px] text-center font-mono text-slate-400">
                <div className="bg-slate-900 rounded p-0.5">EMA <span className={stock.indicators.emaCross === 'BULLISH' ? 'text-green-400' : 'text-red-400'}>{stock.indicators.emaCross}</span></div>
                <div className="bg-slate-900 rounded p-0.5">RSI <span className={stock.indicators.rsi > 60 ? 'text-green-400' : 'text-slate-200'}>{Number(stock.indicators.rsi).toFixed(2)}</span></div>
                <div className="bg-slate-900 rounded p-0.5">MACD <span className={parseFloat(stock.indicators.macd) > 0 ? 'text-green-400' : 'text-slate-200'}>{stock.indicators.macd}</span></div>
                <div className="bg-slate-900 rounded p-0.5">BB U <span className={stock.currentPrice > stock.indicators.bbUpper ? 'text-green-400' : 'text-slate-200'}>{Number(stock.indicators.bbUpper).toFixed(2)}</span></div>
                <div className="bg-slate-900 rounded p-0.5">PSAR <span className={stock.indicators.psar < stock.currentPrice ? 'text-green-400' : 'text-slate-200'}>{Number(stock.indicators.psar).toFixed(2)}</span></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartGrid;
