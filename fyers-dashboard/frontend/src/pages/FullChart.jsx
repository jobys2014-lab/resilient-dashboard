import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChartWidget from '../components/ChartWidget';
import { ArrowLeft, Activity, TrendingUp, BarChart2 } from 'lucide-react';

const FullChart = ({ marketData, timeframe }) => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  
  // Need to handle URL encoding for symbols like NSE:RELIANCE-EQ
  const decodedSymbol = decodeURIComponent(symbol);
  
  const stock = marketData.find(s => s.symbol === decodedSymbol);

  if (!stock) {
    return (
      <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-6 flex flex-col items-center justify-center text-slate-400">
        <Activity size={48} className="opacity-20 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2">Waiting for Data</h2>
        <p>Connecting to live feed for {decodedSymbol}...</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const cleanSymbol = stock.symbol.replace('NSE:', '').replace('-EQ', '');
  const isPositive = parseFloat(stock.priceChangePercent) >= 0;

  return (
    <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-2xl font-black text-white tracking-wider flex items-center gap-2">
              {cleanSymbol}
              <span className={`text-sm px-2 py-0.5 rounded ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isPositive ? '+' : ''}{stock.priceChangePercent}%
              </span>
            </h1>
            <div className="flex gap-4 text-sm mt-1">
              <span className="text-slate-400 font-mono">₹{stock.currentPrice.toFixed(2)}</span>
              {stock.indicators && (
                <>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">Vol: <strong className="text-blue-400">{stock.indicators.volume}</strong></span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">RSI: <strong className={stock.indicators.rsi > 60 ? 'text-green-400' : 'text-yellow-400'}>{Number(stock.indicators.rsi).toFixed(2)}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {stock.buyProbability && (
            <div className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700 flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Smart Money</span>
              <span className={`text-sm font-black ${stock.buyProbability > 50 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.buyProbability > 50 ? 'BUY' : 'SELL'} {Math.max(stock.buyProbability, stock.sellProbability)}%
              </span>
            </div>
          )}
          {stock.indicators && (
            <div className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700 flex flex-col items-end hidden sm:flex">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trend</span>
              <span className={`text-sm font-black ${stock.indicators.emaCross === 'BULLISH' ? 'text-green-400' : 'text-red-400'}`}>
                {stock.indicators.emaCross}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative min-h-[400px]">
        <ChartWidget 
          data={stock.history} 
          timeframe={timeframe} 
          orbHigh={stock.orbHigh} 
          orbLow={stock.orbLow} 
        />
      </div>

      {/* Footer Info */}
      {stock.indicators && (
        <div className="bg-slate-950 p-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs font-mono shrink-0">
          <div className="bg-slate-900 rounded p-1.5 border border-slate-800 text-center flex flex-col">
            <span className="text-slate-500 text-[10px]">MACD</span>
            <span className={parseFloat(stock.indicators.macd) > 0 ? 'text-green-400' : 'text-red-400'}>{stock.indicators.macd}</span>
          </div>
          <div className="bg-slate-900 rounded p-1.5 border border-slate-800 text-center flex flex-col">
            <span className="text-slate-500 text-[10px]">VWAP</span>
            <span className={stock.currentPrice > stock.indicators.vwapVal ? 'text-green-400' : 'text-red-400'}>{stock.indicators.vwapVal}</span>
          </div>
          <div className="bg-slate-900 rounded p-1.5 border border-slate-800 text-center flex flex-col">
            <span className="text-slate-500 text-[10px]">BB UPPER</span>
            <span className="text-slate-300">{Number(stock.indicators.bbUpper).toFixed(2)}</span>
          </div>
          <div className="bg-slate-900 rounded p-1.5 border border-slate-800 text-center flex flex-col">
            <span className="text-slate-500 text-[10px]">PSAR</span>
            <span className="text-slate-300">{Number(stock.indicators.psar).toFixed(2)}</span>
          </div>
          <div className="bg-slate-900 rounded p-1.5 border border-slate-800 text-center flex flex-col">
            <span className="text-slate-500 text-[10px]">BURST</span>
            <span className="text-blue-400">{stock.volumeBurst}x</span>
          </div>
          <div className="bg-slate-900 rounded p-1.5 border border-slate-800 text-center flex flex-col">
            <span className="text-slate-500 text-[10px]">OI CHG</span>
            <span className={parseFloat(stock.oiChangePercent) > 0 ? 'text-green-400' : 'text-red-400'}>{stock.oiChangePercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullChart;
