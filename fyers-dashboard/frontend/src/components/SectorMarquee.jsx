import React from 'react';

const SectorMarquee = ({ marketData = [] }) => {
  // Use live data for Nifty 50 and Bank Nifty if available
  const liveNifty = marketData.find(d => d.symbol === 'NSE:NIFTY-50');
  const liveBank = marketData.find(d => d.symbol === 'NSE:NIFTYBANK');

  const liveIT = marketData.find(d => d.symbol === 'NSE:NIFTYIT');
  const liveAuto = marketData.find(d => d.symbol === 'NSE:NIFTYAUTO');
  const livePharma = marketData.find(d => d.symbol === 'NSE:NIFTYPHARMA');
  const liveMetal = marketData.find(d => d.symbol === 'NSE:NIFTYMETAL');
  const liveFmcg = marketData.find(d => d.symbol === 'NSE:NIFTYFMCG');

  const sectors = [
    { 
      name: 'NIFTY 50', 
      value: liveNifty ? liveNifty.currentPrice.toLocaleString() : '---', 
      change: liveNifty ? `${liveNifty.priceChangePercent >= 0 ? '+' : ''}${liveNifty.priceChangePercent}%` : '---' 
    },
    { 
      name: 'NIFTY BANK', 
      value: liveBank ? liveBank.currentPrice.toLocaleString() : '---', 
      change: liveBank ? `${liveBank.priceChangePercent >= 0 ? '+' : ''}${liveBank.priceChangePercent}%` : '---' 
    },
    { 
      name: 'NIFTY IT', 
      value: liveIT ? liveIT.currentPrice.toLocaleString() : '---', 
      change: liveIT ? `${liveIT.priceChangePercent >= 0 ? '+' : ''}${liveIT.priceChangePercent}%` : '---' 
    },
    { 
      name: 'NIFTY AUTO', 
      value: liveAuto ? liveAuto.currentPrice.toLocaleString() : '---', 
      change: liveAuto ? `${liveAuto.priceChangePercent >= 0 ? '+' : ''}${liveAuto.priceChangePercent}%` : '---' 
    },
    { 
      name: 'NIFTY PHARMA', 
      value: livePharma ? livePharma.currentPrice.toLocaleString() : '---', 
      change: livePharma ? `${livePharma.priceChangePercent >= 0 ? '+' : ''}${livePharma.priceChangePercent}%` : '---' 
    },
    { 
      name: 'NIFTY METAL', 
      value: liveMetal ? liveMetal.currentPrice.toLocaleString() : '---', 
      change: liveMetal ? `${liveMetal.priceChangePercent >= 0 ? '+' : ''}${liveMetal.priceChangePercent}%` : '---' 
    },
    { 
      name: 'NIFTY FMCG', 
      value: liveFmcg ? liveFmcg.currentPrice.toLocaleString() : '---', 
      change: liveFmcg ? `${liveFmcg.priceChangePercent >= 0 ? '+' : ''}${liveFmcg.priceChangePercent}%` : '---' 
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center shadow-lg relative h-8">
      <div className="absolute left-0 z-10 bg-slate-900 px-3 py-1 h-full flex items-center border-r border-slate-800 font-bold text-xs text-blue-400 tracking-wider">
        LIVE SECTORS
      </div>
      <div className="flex-1 overflow-hidden ml-[100px]">
        <div className="animate-marquee-custom">
          {sectors.map((sector, idx) => {
            const isPositive = sector.change.startsWith('+');
            const numericValue = parseFloat(sector.value.replace(/,/g, ''));
            const displayValue = isNaN(numericValue) ? sector.value : numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return (
              <span key={idx} className="mx-6 text-xs flex items-center gap-2">
                <span className="font-semibold text-slate-300">{sector.name}</span>
                <span className="font-mono text-slate-100">{displayValue}</span>
                <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {sector.change}
                </span>
              </span>
            );
          })}
          {/* Duplicate for seamless infinite scrolling */}
          {sectors.map((sector, idx) => {
            const isPositive = sector.change.startsWith('+');
            const numericValue = parseFloat(sector.value.replace(/,/g, ''));
            const displayValue = isNaN(numericValue) ? sector.value : numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return (
              <span key={`dup-${idx}`} className="mx-6 text-xs flex items-center gap-2">
                <span className="font-semibold text-slate-300">{sector.name}</span>
                <span className="font-mono text-slate-100">{displayValue}</span>
                <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {sector.change}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SectorMarquee;
