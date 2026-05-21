import axios from 'axios';

let YAHOO_SYMBOLS = [];
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
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 150 + (Math.abs(hash) % 1350);
};

const buildSymbolMappings = (chartinkSymbols) => {
  let baseSymbols = chartinkSymbols.length > 0 ? chartinkSymbols : ['RELIANCE', 'SBIN', 'HDFCBANK', 'TCS'];
  baseSymbols = baseSymbols.map(s => s.trim().replace(/[^a-zA-Z0-9-&]/g, ''));
  
  YAHOO_SYMBOLS = baseSymbols.map(sym => `${sym}.NS`);
  const indices = ['^NSEI', '^NSEBANK', '^CNXIT', '^CNXAUTO', '^CNXPHARMA', '^CNXMETAL', '^CNXFMCG'];
  YAHOO_SYMBOLS = [...YAHOO_SYMBOLS, ...indices];
  
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
      currentPrice: basePrice,
      history: []
    };
  });
};

async function test() {
  const chartinkSymbols = ['TRENT', 'BLUESTARCO', 'ONGC'];
  buildSymbolMappings(chartinkSymbols);
  lastMarketData = initializeDummyData(chartinkSymbols);

  console.log('YAHOO_SYMBOLS:', YAHOO_SYMBOLS);
  console.log('symbolMap:', symbolMap);
  console.log('lastMarketData symbols:', lastMarketData.map(s => s.symbol));

  for (let i = 0; i < YAHOO_SYMBOLS.length; i++) {
    const ySymbol = YAHOO_SYMBOLS[i];
    const uiSymbol = symbolMap[ySymbol];
    console.log(`\n--- Processing ${ySymbol} (${uiSymbol}) ---`);
    if (!uiSymbol) {
      console.log(`Skipping because no uiSymbol mapping found.`);
      continue;
    }
    
    const stockIndex = lastMarketData.findIndex(s => s.symbol === uiSymbol);
    console.log(`stockIndex in lastMarketData: ${stockIndex}`);
    if (stockIndex === -1) {
      console.log(`Skipping because stockIndex is -1.`);
      continue;
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=5m&range=5d`;
      console.log(`Fetching ${url}...`);
      const res = await axios.get(url);
      const result = res.data.chart.result[0];
      
      if (result && result.meta) {
        console.log(`Successfully fetched metadata. regularMarketPrice = ${result.meta.regularMarketPrice}`);
        let history = [];
        if (result.timestamp && result.indicators.quote[0]) {
          const quote = result.indicators.quote[0];
          const timestamps = result.timestamp;
          console.log(`Found ${timestamps.length} timestamps in Yahoo response.`);
          
          for (let j = 0; j < timestamps.length; j++) {
            if (quote.open[j] === null) continue;
            history.push({
              time: timestamps[j] + 19800,
              open: quote.open[j],
              high: quote.high[j],
              low: quote.low[j],
              close: quote.close[j]
            });
          }
          console.log(`Parsed ${history.length} valid candles (non-null open).`);
        } else {
          console.log(`No timestamps or quote indicators in result!`);
        }
        
        if (history.length === 0) {
          console.log(`History is empty. Mocking data...`);
          // simulate mock
        }
        
        lastMarketData[stockIndex].history = history;
        console.log(`Updated lastMarketData[${stockIndex}].history. New length = ${lastMarketData[stockIndex].history.length}`);
      } else {
        console.log(`Yahoo result has no metadata!`);
      }
    } catch (err) {
      console.error(`ERROR fetching history for ${ySymbol}:`, err.message);
    }
  }
}

test();
