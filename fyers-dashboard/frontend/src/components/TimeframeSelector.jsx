import React from 'react';

const TimeframeSelector = ({ timeframe, setTimeframe }) => {
  const options = [
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1H' },
    { value: '120', label: '2H' },
    { value: 'D', label: '1D' },
  ];

  return (
    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">
      <label htmlFor="timeframe" className="text-xs font-bold text-slate-400">Timeframe:</label>
      <select
        id="timeframe"
        value={timeframe}
        onChange={(e) => setTimeframe(e.target.value)}
        className="bg-slate-700 text-white font-bold text-xs rounded border border-slate-600 outline-none px-2 py-1 cursor-pointer hover:bg-slate-600 focus:border-blue-500 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

export default TimeframeSelector;
