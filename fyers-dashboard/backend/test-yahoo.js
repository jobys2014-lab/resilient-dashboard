import axios from 'axios';

const indices = ['^NSEI', '^NSEBANK', '^CNXIT', '^CNXAUTO', '^CNXPHARMA', '^CNXMETAL', '^CNXFMCG', 'NIFTY_AUTO.NS'];

async function test() {
  for (const sym of indices) {
    try {
      const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=5m&range=1d`);
      const result = res.data.chart.result[0];
      if (result && result.meta) {
        console.log(`Symbol ${sym} is VALID. Price: ${result.meta.regularMarketPrice}, PrevClose: ${result.meta.chartPreviousClose}`);
      } else {
        console.log(`Symbol ${sym} returned empty result.`);
      }
    } catch (e) {
      console.log(`Symbol ${sym} FAILED: ${e.message}`);
    }
  }
}

test();
