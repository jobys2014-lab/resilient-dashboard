import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';

const ChartWidget = ({ data, timeframe, orbHigh, orbLow }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const orbHighLineRef = useRef();
  const orbLowLineRef = useRef();

  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: 'solid', color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1e293b',
      },
      rightPriceScale: {
        borderColor: '#1e293b',
      },
      autoSize: true,
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    seriesRef.current = candlestickSeries;

    if (data && data.length > 0) {
      candlestickSeries.setData(data);
      chart.timeScale().fitContent();
      hasFittedRef.current = true;
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial resize to ensure correct bounds
    setTimeout(handleResize, 10);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    hasFittedRef.current = false;
  }, [timeframe]);

  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
        // Resample data based on selected timeframe
        let resampledData = [...data];
        
        let groupSize = 1; // Default 5m (since backend provides 5m)
        if (timeframe === '15') groupSize = 3;
        else if (timeframe === '30') groupSize = 6;
        else if (timeframe === '60') groupSize = 12;
        else if (timeframe === '120') groupSize = 24;
        else if (timeframe === 'D') groupSize = 75; // 375 mins in Indian trading day / 5m
        
        if (groupSize > 1) {
          resampledData = [];
          for (let i = 0; i < data.length; i += groupSize) {
            const chunk = data.slice(i, i + groupSize);
            const aggregated = {
              time: chunk[0].time,
              open: chunk[0].open,
              high: Math.max(...chunk.map(c => c.high)),
              low: Math.min(...chunk.map(c => c.low)),
              close: chunk[chunk.length - 1].close
            };
            resampledData.push(aggregated);
          }
        }
        
        seriesRef.current.setData(resampledData);

        if (!hasFittedRef.current && chartRef.current) {
          chartRef.current.timeScale().fitContent();
          hasFittedRef.current = true;
        }
    }
  }, [data, timeframe]);

  useEffect(() => {
    if (seriesRef.current && orbHigh && orbLow) {
      if (orbHighLineRef.current) seriesRef.current.removePriceLine(orbHighLineRef.current);
      if (orbLowLineRef.current) seriesRef.current.removePriceLine(orbLowLineRef.current);

      orbHighLineRef.current = seriesRef.current.createPriceLine({
        price: orbHigh,
        color: 'rgba(234, 179, 8, 0.6)',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'ORB HIGH',
      });

      orbLowLineRef.current = seriesRef.current.createPriceLine({
        price: orbLow,
        color: 'rgba(234, 179, 8, 0.6)',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'ORB LOW',
      });
    }
  }, [orbHigh, orbLow]);

  return <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />;
};

export default ChartWidget;
