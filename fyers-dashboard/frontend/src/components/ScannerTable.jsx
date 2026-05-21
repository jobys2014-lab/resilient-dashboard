import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

const ScannerTable = ({ alerts = [], marketData = [] }) => {
  const previousAlertId = useRef(null);
  const navigate = useNavigate();

  // Get top 6 stocks by percentage change for the leaderboard
  const topGainers = marketData
    .filter(d => !d.symbol.includes('NIFTY') && !d.symbol.includes('BANK'))
    .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
    .slice(0, 6);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const latestAlert = alerts[0];
      if (latestAlert.id !== previousAlertId.current && latestAlert.status === 'REVERSAL') {
        previousAlertId.current = latestAlert.id;
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();
          setTimeout(() => oscillator.stop(), 200);
        } catch (e) {
          console.error('Audio playback failed', e);
        }
      }
    }
  }, [alerts]);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 flex flex-col h-full shadow-lg overflow-hidden">
      
      {/* TOP GAINERS LEADERBOARD */}
      <div className="flex flex-col border-b border-slate-800 h-1/2">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h2 className="text-sm font-black flex items-center gap-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] px-3 py-1 bg-black/50 rounded border border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.3)] tracking-wider">
            <TrendingUp size={16} className="text-yellow-400" />
            SUPER STARS OF THE DAY
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {topGainers.map((stock, i) => (
            <div 
              key={i} 
              onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}`)}
              className="flex justify-between items-center p-2 rounded hover:bg-slate-800 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">{i + 1}</span>
                <span className="font-bold text-slate-200 text-xs">{stock.symbol.replace('NSE:', '').replace('-EQ', '')}</span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-xs font-mono font-bold text-white">{stock.currentPrice.toFixed(2)}</span>
                <span className={`text-[10px] font-bold ${parseFloat(stock.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(stock.priceChangePercent) >= 0 ? '+' : ''}{stock.priceChangePercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SCANNER ALERTS */}
      <div className="flex flex-col flex-1 h-1/2">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            Live Scanner Alerts
          </h2>
          <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {alerts.length} ALERTS
          </span>
        </div>
      
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Activity size={32} className="opacity-20 animate-pulse" />
            <p className="text-xs font-medium">Waiting for scanner conditions...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                onClick={() => navigate(`/chart/${encodeURIComponent(alert.symbol)}`)}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-slate-200 text-sm">{alert.symbol}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{alert.time}</p>
                  </div>
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {alert.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-slate-900/50 rounded p-2 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Morning Drop</p>
                    <p className="text-xs font-bold text-red-400 flex items-center">
                      <ArrowDownRight size={12} className="mr-1" />
                      {Number(alert.dropPercent).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Recovery</p>
                    <p className="text-xs font-bold text-green-400 flex items-center">
                      <ArrowUpRight size={12} className="mr-1" />
                      +{Number(alert.currentChange).toFixed(2)}%
                    </p>
                  </div>
                </div>
                
                {/* VWAP and Volume Badges */}
                {(alert.vwapReclaimed !== undefined && alert.volumeBurst !== undefined) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    <div className={`flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider ${alert.vwapReclaimed ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      VWAP {alert.vwapReclaimed ? 'RECLAIMED' : 'BELOW'}
                    </div>
                    <div className="flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {Number(alert.volumeBurst).toFixed(2)}x VOL
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ScannerTable;
