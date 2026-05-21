import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis, ReferenceArea } from 'recharts';

const CustomBubble = (props) => {
  const { cx, cy, payload, r } = props;
  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;

  const radius = r && !isNaN(r) && r > 0 ? r : 30;

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill={payload.color} fillOpacity={0.85} stroke={payload.strokeColor} strokeWidth={1} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={radius > 12 ? 10 : 0} fontWeight="bold" style={{ pointerEvents: 'none' }}>
        {payload.symbol.split('-')[0].replace('NSE:', '')}
      </text>
    </g>
  );
};

const CustomTooltipBubble = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="font-bold text-slate-200">{data.symbol.split('-')[0]}</p>
        <p className="text-sm"><span className="text-slate-400">State:</span> <span className="font-bold text-white">{data.stateFull}</span></p>
        <p className="text-sm"><span className="text-slate-400">Price CHG:</span> <span className={data.pChg > 0 ? 'text-green-400' : 'text-red-400'}>{data.pChg}%</span></p>
        <p className="text-sm"><span className="text-slate-400">OI CHG:</span> <span className={data.oiChg > 0 ? 'text-green-400' : 'text-red-400'}>{data.oiChg}%</span></p>
      </div>
    );
  }
  return null;
};

const AdvancedAnalytics = ({ marketData }) => {
  const [bubbleZoomX, setBubbleZoomX] = useState(10);
  const [bubbleZoomY, setBubbleZoomY] = useState(10);
  const [rrgZoomX, setRrgZoomX] = useState(10);
  const [rrgZoomY, setRrgZoomY] = useState(10);

  const bubbleData = marketData
    .filter(stock => !stock.symbol.includes('NIFTY') && !stock.symbol.includes('BANK'))
    .map(stock => {
      const pChg = parseFloat(stock.priceChangePercent) || 0;
      const oiChg = parseFloat(stock.oiChangePercent) || 0;
    
    let stateFull = 'Long Buildup';
    let color = '#166534'; // Dark Green
    let strokeColor = '#22c55e';

    if (pChg >= 0 && oiChg >= 0) {
      stateFull = 'Long Buildup'; color = '#15803d'; strokeColor = '#22c55e'; // Top Right
    } else if (pChg >= 0 && oiChg < 0) {
      stateFull = 'Short Covering'; color = '#854d0e'; strokeColor = '#eab308'; // Top Left
    } else if (pChg < 0 && oiChg >= 0) {
      stateFull = 'Short Buildup'; color = '#b91c1c'; strokeColor = '#ef4444'; // Bottom Right
    } else {
      stateFull = 'Long Unwinding'; color = '#1d4ed8'; strokeColor = '#3b82f6'; // Bottom Left
    }

    return {
      ...stock,
      pChg,
      oiChg,
      stateFull,
      color,
      strokeColor,
      volSize: parseFloat(stock.volumeBurst) * 150
    };
  });

  const rrgData = marketData
    .filter(stock => !stock.symbol.includes('NIFTY') && !stock.symbol.includes('BANK'))
    .slice(0, 15) // Limit to top 15 so it's not messy
    .map(stock => {
      // Calculate RS-Ratio and Momentum based on price changes
      const currentRatio = 100 + (parseFloat(stock.priceChangePercent) || 0) * 3;
      const currentMomentum = 100 + ((parseFloat(stock.priceChangePercent) || 0) - (parseFloat(stock.oldPriceChangePercent) || 0)) * 10;
      
      // Determine final quadrant color
      let color = '#ef4444'; // Lagging
      if (currentRatio >= 100 && currentMomentum >= 100) color = '#22c55e'; // Leading
      else if (currentRatio >= 100 && currentMomentum < 100) color = '#eab308'; // Weakening
      else if (currentRatio < 100 && currentMomentum >= 100) color = '#3b82f6'; // Improving
      
      // Generate a realistic, deterministic path trail leading up to the current point
      const trail = [];
      
      // Create a deterministic offset based on the stock's name so offline market doesn't jitter
      const charCode1 = stock.symbol.charCodeAt(0) || 65;
      const charCode2 = stock.symbol.charCodeAt(1) || 65;
      const staticOffsetX = ((charCode1 % 5) + 1) * (charCode1 % 2 === 0 ? 1 : -1);
      const staticOffsetY = ((charCode2 % 5) + 1) * (charCode2 % 2 === 0 ? 1 : -1);

      // Try to use actual momentum, fallback to static offset if market is closed/flat
      const momDiff = (parseFloat(stock.priceChangePercent) || 0) - (parseFloat(stock.oldPriceChangePercent) || 0);
      const ratioOffset = momDiff !== 0 ? momDiff * 2 : staticOffsetX;
      const momOffset = momDiff !== 0 ? momDiff * 5 : staticOffsetY;

      let ratioTrail = currentRatio - ratioOffset;
      let momTrail = currentMomentum - momOffset;
      
      for (let i = 0; i < 4; i++) {
        trail.push({ x: Number(ratioTrail.toFixed(1)), y: Number(momTrail.toFixed(1)) });
        ratioTrail += (currentRatio - ratioTrail) / (4 - i);
        momTrail += (currentMomentum - momTrail) / (4 - i);
      }
      trail.push({ x: Number(currentRatio.toFixed(1)), y: Number(currentMomentum.toFixed(1)) });

      return {
        name: stock.symbol.split('-')[0].replace('NSE:', ''),
        color,
        data: trail
      };
    });

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-2 flex-1 bg-slate-950">
      
      {/* Chart 1: Exact OI vs Price Bubble Chart */}
      <div className="bg-slate-100 rounded-lg flex flex-col h-[600px] shrink-0 shadow-2xl relative border-4 border-slate-300">
        <div className="absolute top-4 left-6 right-6 z-10 flex justify-between items-center bg-white/90 px-4 py-2 rounded shadow backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-800">
            Futures Price vs OI Analysis
          </h2>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
            <div className="flex items-center gap-2 bg-slate-200 px-2 py-1 rounded">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">X-Zoom</span>
              <input 
                type="range" min="1" max="25" step="0.5" 
                value={bubbleZoomX} onChange={(e) => setBubbleZoomX(Number(e.target.value))} 
                className="w-16 sm:w-24 accent-slate-800 cursor-pointer" 
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-200 px-2 py-1 rounded">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Y-Zoom</span>
              <input 
                type="range" min="1" max="25" step="0.5" 
                value={bubbleZoomY} onChange={(e) => setBubbleZoomY(Number(e.target.value))} 
                className="w-16 sm:w-24 accent-slate-800 cursor-pointer" 
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full relative pt-16 pb-4 pr-4 pl-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis type="number" dataKey="oiChg" name="OI CHG(%)" stroke="#475569" tickFormatter={(v) => v.toFixed(1)} domain={[-bubbleZoomX, bubbleZoomX]} allowDataOverflow={true} />
              <YAxis type="number" dataKey="pChg" name="Price CHG" stroke="#475569" tickFormatter={(v) => v.toFixed(1)} domain={[-bubbleZoomY, bubbleZoomY]} allowDataOverflow={true} />
              <ZAxis type="number" dataKey="volSize" range={[500, 8000]} />
              <Tooltip content={<CustomTooltipBubble />} cursor={{ strokeDasharray: '3 3' }} />
              
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
              <ReferenceLine x={0} stroke="#475569" strokeWidth={1} />
              
              <Scatter name="Stocks" data={bubbleData} shape={<CustomBubble />} />
            </ScatterChart>
          </ResponsiveContainer>
          
          <div className="absolute top-16 right-16 text-slate-500 font-bold text-lg pointer-events-none">Long</div>
          <div className="absolute top-16 left-20 text-slate-500 font-bold text-lg pointer-events-none">Short-Covering</div>
          <div className="absolute bottom-12 right-16 text-slate-500 font-bold text-lg pointer-events-none">Short</div>
          <div className="absolute bottom-12 left-20 text-slate-500 font-bold text-lg pointer-events-none">Long-Unwind</div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-700 font-bold text-sm pointer-events-none">OI CHG(%)</div>
          <div className="absolute top-1/2 left-4 -translate-y-1/2 -rotate-90 text-slate-700 font-bold text-sm pointer-events-none">Price CHG(%)</div>
        </div>
      </div>

      {/* Chart 2: Relative Rotation Graph (RRG) */}
      <div className="bg-white rounded-lg flex flex-col h-[600px] shrink-0 shadow-2xl relative border-4 border-slate-300">
        <div className="absolute top-4 left-6 right-6 z-10 flex justify-between items-center bg-white/90 px-4 py-2 rounded shadow backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-800">
            Relative Performance Graph <span className="text-yellow-600">(Sperm Travel)</span>
          </h2>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
            <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">X-Zoom</span>
              <input 
                type="range" min="1" max="25" step="0.5" 
                value={rrgZoomX} onChange={(e) => setRrgZoomX(Number(e.target.value))} 
                className="w-16 sm:w-24 accent-slate-800 cursor-pointer" 
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Y-Zoom</span>
              <input 
                type="range" min="1" max="25" step="0.5" 
                value={rrgZoomY} onChange={(e) => setRrgZoomY(Number(e.target.value))} 
                className="w-16 sm:w-24 accent-slate-800 cursor-pointer" 
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full relative pt-16 pb-4 pr-4 pl-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <ReferenceArea x1={100} x2={100 + rrgZoomX * 2} y1={100} y2={100 + rrgZoomY * 2} fill="#dcfce7" fillOpacity={0.5} />
              <ReferenceArea x1={100} x2={100 + rrgZoomX * 2} y1={100 - rrgZoomY * 2} y2={100} fill="#fef08a" fillOpacity={0.5} />
              <ReferenceArea x1={100 - rrgZoomX * 2} x2={100} y1={100 - rrgZoomY * 2} y2={100} fill="#fee2e2" fillOpacity={0.5} />
              <ReferenceArea x1={100 - rrgZoomX * 2} x2={100} y1={100} y2={100 + rrgZoomY * 2} fill="#dbeafe" fillOpacity={0.5} />

              <CartesianGrid strokeDasharray="3 3" stroke="#eab308" opacity={0.6} />
              <XAxis type="number" dataKey="x" name="RS-Ratio" stroke="#475569" domain={[100 - rrgZoomX, 100 + rrgZoomX]} allowDataOverflow={true} tickFormatter={(v) => v.toFixed(1)} label={{ value: 'RS-Ratio', position: 'insideBottomRight', offset: -10, fill: '#475569', fontWeight: 'bold' }} />
              <YAxis type="number" dataKey="y" name="RS-Momentum" stroke="#475569" domain={[100 - rrgZoomY, 100 + rrgZoomY]} allowDataOverflow={true} tickFormatter={(v) => v.toFixed(1)} label={{ value: 'RS-Momentum', angle: -90, position: 'insideTopLeft', offset: 15, fill: '#475569', fontWeight: 'bold' }} />
              <ZAxis type="number" range={[50, 50]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              
              <ReferenceLine y={100} stroke="#94a3b8" strokeWidth={2} />
              <ReferenceLine x={100} stroke="#94a3b8" strokeWidth={2} />
              
              {rrgData.map((series, index) => (
                <Scatter 
                  key={index} 
                  name={series.name} 
                  data={series.data} 
                  fill={series.color} 
                  line={{ stroke: series.color, strokeWidth: 2 }} 
                  shape={(props) => {
                    const { cx, cy, payload, index: dataIndex } = props;
                    if (!cx || !cy) return null;
                    if (dataIndex === series.data.length - 1) {
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={9} fill={series.color} stroke="#ffffff" strokeWidth={1} />
                          <text x={cx + 12} y={cy} dominantBaseline="central" fill="#334155" fontSize={12} fontWeight="bold">
                            {series.name} ({payload.x.toFixed(1)}, {payload.y.toFixed(1)})
                          </text>
                        </g>
                      );
                    }
                    return <circle cx={cx} cy={cy} r={2.5} fill={series.color} opacity={0.6} />;
                  }}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          
          <div className="absolute top-20 right-20 text-slate-800 font-bold text-lg pointer-events-none">LEADING</div>
          <div className="absolute bottom-16 right-20 text-slate-800 font-bold text-lg pointer-events-none">WEAKENING</div>
          <div className="absolute bottom-16 left-20 text-slate-800 font-bold text-lg pointer-events-none">LAGGING</div>
          <div className="absolute top-20 left-20 text-slate-800 font-bold text-lg pointer-events-none">IMPROVING</div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
