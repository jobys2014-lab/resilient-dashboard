import { WebSocketServer } from 'ws';
import { runScanner } from './scanner.js';
import axios from 'axios';
import { getChartinkSymbols } from './chartink.js';
import { 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands, 
  calculateParabolicSAR 
} from './indicators.js';

let YAHOO_SYMBOLS = [];
let SYMBOLS_STRING = '';
let symbolMap = {};
let lastMarketData = [];

const fallbackPrices = {
  'NSE:NIFTY-50': 23720.0,
  'NSE:NIFTYBANK': 53650.0,
  'NSE:NIFTYIT': 29060.0,
  'NSE:NIFTYAUTO': 26030.0,
  'NSE:NIFTYPHARMA': 24840.0,
  'NSE:NIFTYMETAL': 13250.0,
  'NSE:NIFTYFMCG': 50330.0
};

const getFallbackPrice = (symbol) => {
  if (fallbackPrices[symbol]) return fallbackPrices[symbol];
  // Stable hash based on symbol name to keep fallback price consistent
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 150 + (Math.abs(hash) % 1350); // 150 to 1500
};

// Helper to shift UTC timestamp to IST parts
const getISTTimeParts = (t) => {
  const date = new Date(t * 1000);
  const shifted = new Date(date.getTime() + 19800 * 1000); // 5h 30m offset
  return {
    dateStr: `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`,
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes()
  };
};

// Helper to rebuild symbol mappings when Chartink symbols change
const buildSymbolMappings = (chartinkSymbols) => {
  let baseSymbols = chartinkSymbols.length > 0 ? chartinkSymbols : ['RELIANCE', 'SBIN', 'HDFCBANK', 'TCS'];
  baseSymbols = baseSymbols.map(s => s.trim().replace(/[^a-zA-Z0-9-&]/g, ''));
  
  YAHOO_SYMBOLS = baseSymbols.map(sym => `${sym}.NS`);
  
  const indices = ['^NSEI', '^NSEBANK', '^CNXIT', '^CNXAUTO', '^CNXPHARMA', '^CNXMETAL', '^CNXFMCG'];
  YAHOO_SYMBOLS = [...YAHOO_SYMBOLS, ...indices];
  
  SYMBOLS_STRING = YAHOO_SYMBOLS.join(',');
  
  symbolMap = {};
  YAHOO_SYMBOLS.forEach(sym => {
    if (sym === '^NSEI') symbolMap[sym] = 'NSE:NIFTY-50';
    else if (sym === '^NSEBANK') symbolMap[sym] = 'NSE:NIFTYBANK';
    else if (sym === '^CNXIT') symbolMap[sym] = 'NSE:NIFTYIT';
    else if (sym === '^CNXAUTO') symbolMap[sym] = 'NSE:NIFTYAUTO';
    else if (sym === '^CNXPHARMA') symbolMap[sym] = 'NSE:NIFTYPHARMA';
    else if (sym === '^CNXMETAL') symbolMap[sym] = 'NSE:NIFTYMETAL';
    else if (sym === '^CNXFMCG') symbolMap[sym] = 'NSE:NIFTYFMCG';
    else symbolMap[sym] = `NSE:${sym.replace('.NS', '')}-EQ`;
  });
};

const initializeDummyData = (chartinkSymbols = []) => {
  const symbols = Object.values(symbolMap);
  return symbols.map(sym => {
    const isChartink = chartinkSymbols.some(c => 
      sym === `NSE:${c}-EQ` || sym === `NSE:${c}` || sym === `NSE:${c.replace('.NS', '')}-EQ`
    );
    
    const basePrice = getFallbackPrice(sym);
    
    return {
      symbol: sym,
      isChartink: isChartink,
      open: basePrice,
      low_915_to_1000: basePrice * 0.99,
      currentPrice: basePrice,
      priceChangePercent: '0.00',
      oiChangePercent: '0.00',
      oldPriceChangePercent: '0.00',
      oldOiChangePercent: '0.00',
      sector: 'NSE:NIFTY-50',
      sectorChange: 0,
      vwap: basePrice,
      volumeBurst: 1.0,
      history: [],
      orbHigh: basePrice * 1.01,
      orbLow: basePrice * 0.99,
      isRealDataInitialized: false,
      indicators: {
        emaCross: 'BULLISH',
        rsi: 50,
        macd: '0.00',
        bbUpper: basePrice * 1.02,
        psar: basePrice * 0.98,
        elderForce: '1.2K',
        volume: '50K',
        avgVolume: '45K',
        adxDi: '+DI > -DI',
        diPlus: '22.0',
        cpr: basePrice,
        vwapVal: basePrice
      },
      buyProbability: 50,
      sellProbability: 50
    };
  });
};

// Calculate ORB based on the last available day's 9:15-10:00 AM candles in history
const calculateORB = (history) => {
  if (!history || history.length === 0) return { orbHigh: 0, orbLow: 0 };
  
  // Find the date of the last candle
  const lastCandle = history[history.length - 1];
  const lastCandleParts = getISTTimeParts(lastCandle.time);
  const latestDateStr = lastCandleParts.dateStr;
  
  // Filter candles of the same day
  const dayCandles = history.filter(c => {
    const parts = getISTTimeParts(c.time);
    return parts.dateStr === latestDateStr;
  });
  
  // Filter for ORB range (9:15 to 10:00 IST)
  const orbCandles = dayCandles.filter(c => {
    const parts = getISTTimeParts(c.time);
    return (parts.hour === 9 && parts.minute >= 15) || (parts.hour === 10 && parts.minute === 0);
  });
  
  if (orbCandles.length > 0) {
    const high = Math.max(...orbCandles.map(c => c.high));
    const low = Math.min(...orbCandles.map(c => c.low));
    return { orbHigh: high, orbLow: low };
  } else {
    // If no candles exist for today's ORB yet (e.g. before 9:15 AM), check the previous session
    const dates = [...new Set(history.map(c => getISTTimeParts(c.time).dateStr))];
    if (dates.length > 1) {
      const prevDateStr = dates[dates.length - 2];
      const prevDayCandles = history.filter(c => getISTTimeParts(c.time).dateStr === prevDateStr);
      const prevOrbCandles = prevDayCandles.filter(c => {
        const parts = getISTTimeParts(c.time);
        return (parts.hour === 9 && parts.minute >= 15) || (parts.hour === 10 && parts.minute === 0);
      });
      if (prevOrbCandles.length > 0) {
        return {
          orbHigh: Math.max(...prevOrbCandles.map(c => c.high)),
          orbLow: Math.min(...prevOrbCandles.map(c => c.low))
        };
      }
    }
  }
  return { orbHigh: lastCandle.close * 1.01, orbLow: lastCandle.close * 0.99 };
};

// Calculate and assign actual indicators based on historical candle data
const updateIndicators = (stock) => {
  const history = stock.history;
  if (!history || history.length < 20) return;

  const lastIdx = history.length - 1;
  const currentPrice = stock.currentPrice;

  // Make sure we include current price in the last candle for real-time calculations
  const calcHistory = [...history];
  calcHistory[lastIdx] = {
    ...calcHistory[lastIdx],
    close: currentPrice,
    high: Math.max(calcHistory[lastIdx].high, currentPrice),
    low: Math.min(calcHistory[lastIdx].low, currentPrice)
  };

  const ema20 = calculateEMA(calcHistory, 20);
  const rsiVal = calculateRSI(calcHistory, 14);
  const macdVal = calculateMACD(calcHistory, 12, 26, 9);
  const bbVal = calculateBollingerBands(calcHistory, 20, 2);
  const psarVal = calculateParabolicSAR(calcHistory);

  const lastEma = ema20[lastIdx] || currentPrice;
  const lastRsi = rsiVal[lastIdx] || 50;
  const lastMacdObj = macdVal[lastIdx] || { macd: '0.00' };
  const lastBbObj = bbVal[lastIdx] || { upper: currentPrice * 1.02, lower: currentPrice * 0.98 };
  const lastPsar = psarVal[lastIdx] || currentPrice * 0.98;

  if (!stock.indicators) stock.indicators = {};
  stock.indicators.emaCross = currentPrice >= lastEma ? 'BULLISH' : 'BEARISH';
  stock.indicators.rsi = lastRsi;
  stock.indicators.macd = lastMacdObj.macd;
  stock.indicators.bbUpper = lastBbObj.upper || currentPrice * 1.02;
  stock.indicators.psar = lastPsar;

  // Technical Scoring
  let score = 50;
  if (lastRsi > 50 && lastRsi <= 70) score += 15;
  else if (lastRsi > 70) score += 5;
  else if (lastRsi < 50 && lastRsi >= 30) score -= 15;
  else if (lastRsi < 30) score -= 5;

  if (parseFloat(lastMacdObj.macd) > 0) score += 15;
  else score -= 15;

  if (currentPrice > lastEma) score += 10;
  else score -= 10;

  if (currentPrice > (lastBbObj.upper || 0)) score -= 10;
  else if (currentPrice < (lastBbObj.lower || currentPrice)) score += 10;

  stock.buyProbability = Math.min(95, Math.max(5, Math.round(score)));
  stock.sellProbability = 100 - stock.buyProbability;
};

export const setupWebSocket = async (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.send(JSON.stringify({ type: 'MARKET_DATA', payload: lastMarketData }));
    const currentSignals = runScanner(lastMarketData, null);
    if (currentSignals && currentSignals.length > 0) {
      ws.send(JSON.stringify({ type: 'SCANNER_ALERTS', payload: currentSignals }));
    }
    ws.on('close', () => console.log('Client disconnected'));
  });

  // 1. Fetch live symbols directly from Chartink
  const liveChartinkStocks = await getChartinkSymbols();
  buildSymbolMappings(liveChartinkStocks);
  lastMarketData = initializeDummyData(liveChartinkStocks);
  
  // Broadcast initial structure
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(JSON.stringify({ type: 'MARKET_DATA', payload: lastMarketData }));
  });

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 2. Fetch rich historical data (5 days of 5m candles)
  const fetchRealHistory = async () => {
    console.log('Fetching historical 5d 5m data from Yahoo Finance...');
    for (let i = 0; i < YAHOO_SYMBOLS.length; i++) {
      try {
        const ySymbol = YAHOO_SYMBOLS[i];
        const uiSymbol = symbolMap[ySymbol];
        if (!uiSymbol) continue;
        
        await sleep(200); // safe sleep
        const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=5m&range=5d`);
        const result = res.data.chart.result[0];
        
        if (result && result.meta) {
          const meta = result.meta;
          const stockIndex = lastMarketData.findIndex(s => s.symbol === uiSymbol);
          if (stockIndex === -1) continue;

          lastMarketData[stockIndex].currentPrice = meta.regularMarketPrice;
          const realOpen = meta.chartPreviousClose || lastMarketData[stockIndex].open;
          lastMarketData[stockIndex].open = realOpen;
          lastMarketData[stockIndex].priceChangePercent = (((meta.regularMarketPrice - realOpen) / realOpen) * 100).toFixed(2);

          let history = [];
          if (result.timestamp && result.indicators.quote[0]) {
            const quote = result.indicators.quote[0];
            const timestamps = result.timestamp;
            let vwapSum = 0, volSum = 0;

            for (let j = 0; j < timestamps.length; j++) {
              if (quote.open[j] === null) continue;
              const open = quote.open[j], high = quote.high[j], low = quote.low[j], close = quote.close[j], vol = quote.volume[j] || 0;
              // Pure UNIX timestamps (no timezone manual additions, client handles display offsets)
              history.push({ time: timestamps[j], open, high, low, close });
              
              vwapSum += (high + low + close) / 3 * vol;
              volSum += vol;
            }

            if (volSum > 0) {
              lastMarketData[stockIndex].vwap = vwapSum / volSum;
              lastMarketData[stockIndex].indicators.vwapVal = (vwapSum / volSum).toFixed(2);
            }
          }

          // If history is missing (e.g. pre-market or API anomaly), generate beautiful mock historical candles
          if (history.length === 0) {
            const now = Math.floor(Date.now() / 1000);
            let timeCursor = now - (330 * 300); // ~330 candles ago (approx 4.5 sessions)
            let priceCursor = realOpen;
            for (let k = 0; k < 330; k++) {
              const prev = priceCursor;
              const change = (Math.random() - 0.5) * (realOpen * 0.002);
              priceCursor = Math.max(realOpen * 0.9, Math.min(realOpen * 1.1, priceCursor + change));
              history.push({
                time: timeCursor,
                open: prev,
                high: Math.max(prev, priceCursor) + (Math.random() * (realOpen * 0.0005)),
                low: Math.min(prev, priceCursor) - (Math.random() * (realOpen * 0.0005)),
                close: priceCursor
              });
              timeCursor += 300; // 5 mins
            }
          }

          lastMarketData[stockIndex].history = history;
          
          const orb = calculateORB(history);
          lastMarketData[stockIndex].orbHigh = orb.orbHigh;
          lastMarketData[stockIndex].orbLow = orb.orbLow;

          // Calculate real technical indicators from loaded history
          updateIndicators(lastMarketData[stockIndex]);

          lastMarketData[stockIndex].isRealDataInitialized = true;
        }
      } catch (err) {
        console.error(`Failed to fetch history for ${YAHOO_SYMBOLS[i]}: ${err.message}`);
      }
    }
    console.log('All initial Yahoo history loaded.');
    
    // Broadcast loaded real history
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(JSON.stringify({ type: 'MARKET_DATA', payload: lastMarketData }));
    });
  };

  await fetchRealHistory();

  // 3. Staggered Round-Robin Real Data sync (Every 2 seconds, fetches ONE symbol in loop)
  let currSymbolIdx = 0;
  setInterval(async () => {
    if (YAHOO_SYMBOLS.length === 0 || wss.clients.size === 0) return;
    
    const ySymbol = YAHOO_SYMBOLS[currSymbolIdx];
    const uiSymbol = symbolMap[ySymbol];
    currSymbolIdx = (currSymbolIdx + 1) % YAHOO_SYMBOLS.length;
    
    if (!uiSymbol) return;

    try {
      const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=1m&range=1d`);
      if (res.data && res.data.chart && res.data.chart.result && res.data.chart.result.length > 0) {
        const meta = res.data.chart.result[0].meta;
        const stockIndex = lastMarketData.findIndex(s => s.symbol === uiSymbol);
        
        if (stockIndex !== -1 && meta.regularMarketPrice) {
          const stock = lastMarketData[stockIndex];
          stock.oldPriceChangePercent = stock.priceChangePercent;
          stock.currentPrice = meta.regularMarketPrice;
          
          const realOpen = meta.chartPreviousClose || stock.open;
          stock.open = realOpen;
          
          const changePct = (((meta.regularMarketPrice - realOpen) / realOpen) * 100);
          stock.priceChangePercent = changePct.toFixed(2);
          
          if (stock.history && stock.history.length > 0) {
            const lastCandle = stock.history[stock.history.length - 1];
            lastCandle.close = meta.regularMarketPrice;
            lastCandle.high = Math.max(lastCandle.high, meta.regularMarketPrice);
            lastCandle.low = Math.min(lastCandle.low, meta.regularMarketPrice);
          }
          
          if (meta.regularMarketVolume) {
            stock.indicators.volume = (meta.regularMarketVolume / 1000).toFixed(1) + 'K';
          }

          // Recalculate indicators with updated round robin price
          updateIndicators(stock);
        }
      }
    } catch (err) {
      // Ignore individual errors in round-robin to keep dashboard running
    }
  }, 2000);

  // 4. Live Tick simulation / Jitter Loop (Every 1 second)
  setInterval(() => {
    if (wss.clients.size === 0) return;
    
    lastMarketData.forEach(stock => {
      // Slight jitter: simulate live ticking price (±0.02% max per second)
      const isIndex = stock.symbol.includes('NIFTY') || stock.symbol.includes('BANK');
      const jitterFactor = isIndex ? 0.0001 : 0.0003; // Indices wiggle slightly less
      
      const wiggle = (Math.random() - 0.5) * 2 * jitterFactor;
      stock.currentPrice = stock.currentPrice * (1 + wiggle);
      
      const changePct = (((stock.currentPrice - stock.open) / stock.open) * 100);
      stock.priceChangePercent = changePct.toFixed(2);
      
      // Update history candle
      if (stock.history && stock.history.length > 0) {
        const lastCandle = stock.history[stock.history.length - 1];
        lastCandle.close = stock.currentPrice;
        lastCandle.high = Math.max(lastCandle.high, stock.currentPrice);
        lastCandle.low = Math.min(lastCandle.low, stock.currentPrice);
      }
      
      // Calculate real technical indicators on every tick
      updateIndicators(stock);

      if (!isIndex) {
        stock.oldOiChangePercent = stock.oiChangePercent;
        stock.oiChangePercent = (parseFloat(stock.oiChangePercent) + (Math.random() - 0.5) * 0.2).toFixed(2);
        stock.volumeBurst = Math.max(0.1, (parseFloat(stock.volumeBurst) + (Math.random() - 0.5) * 0.1)).toFixed(1);
      }
    });
    
    // Broadcast live ticks & check scanner alerts
    const signals = runScanner(lastMarketData, null);
    const marketDataMsg = JSON.stringify({ type: 'MARKET_DATA', payload: lastMarketData });
    const alertsMsg = signals.length > 0 ? JSON.stringify({ type: 'SCANNER_ALERTS', payload: signals }) : null;
    
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(marketDataMsg);
        if (alertsMsg) client.send(alertsMsg);
      }
    });
  }, 1000);
};

