import React from 'react';

const AutoScannerMarquee = ({ alerts = [] }) => {
  // Only display BUY signals (positive change) and exclude indices
  const buyAlerts = alerts.filter(a => Number(a.currentChange) > 0 && !a.symbol.includes('NIFTY') && !a.symbol.includes('BANK'));
  
  const displaySignals = buyAlerts.length > 0 
    ? buyAlerts.slice(0, 10).map(alert => ({
        symbol: alert.symbol.replace('NSE:', '').replace('-EQ', ''),
        percent: `${Number(alert.currentChange).toFixed(2)}%`,
        trend: 'up'
      }))
    : [
        { symbol: 'PIIND', percent: '83%', trend: 'up' },
        { symbol: 'FEDERALBNK', percent: '83%', trend: 'up' },
        { symbol: 'LTTS', percent: '83%', trend: 'up' },
        { symbol: 'RELIANCE', percent: '45%', trend: 'up' },
        { symbol: 'HDFCBANK', percent: '60%', trend: 'up' },
      ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center shadow-lg relative h-8 shrink-0">
      <div className="absolute left-0 z-10 bg-slate-900 px-3 py-1 h-full flex items-center border-r border-slate-800 font-bold text-[10px] text-yellow-400 tracking-wider">
        TOP SIGNALS
      </div>
      <div className="flex-1 overflow-hidden ml-[100px]">
        <div className="animate-marquee-custom">
          {displaySignals.map((signal, idx) => (
            <a 
              key={idx} 
              href={`https://in.tradingview.com/chart/?symbol=NSE:${signal.symbol}`}
              target="_blank"
              rel="noreferrer"
              className="mx-6 text-xs flex items-center gap-2 hover:bg-slate-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              <span className={`text-[10px] ${signal.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {signal.trend === 'up' ? '▲' : '▼'}
              </span>
              <span className="font-semibold text-slate-300">{signal.symbol}</span>
              <span className={`font-bold ${signal.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                ({signal.percent})
              </span>
            </a>
          ))}
          {/* Duplicate for seamless infinite scrolling */}
          {displaySignals.map((signal, idx) => (
            <a 
              key={`dup-${idx}`} 
              href={`https://in.tradingview.com/chart/?symbol=NSE:${signal.symbol}`}
              target="_blank"
              rel="noreferrer"
              className="mx-6 text-xs flex items-center gap-2 hover:bg-slate-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              <span className={`text-[10px] ${signal.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {signal.trend === 'up' ? '▲' : '▼'}
              </span>
              <span className="font-semibold text-slate-300">{signal.symbol}</span>
              <span className={`font-bold ${signal.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                ({signal.percent})
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutoScannerMarquee;
