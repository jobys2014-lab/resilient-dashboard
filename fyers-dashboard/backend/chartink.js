import axios from 'axios';

const SCAN_CLAUSE = `( {cash} ( ( {33489} (  [=1] 45 minute "close - 1 candle ago close / 1 candle ago close * 100" >  -3 and  [=1] 45 minute "close - 1 candle ago close / 1 candle ago close * 100" <  0 and  [=1] 1 hour "close - 1 candle ago close / 1 candle ago close * 100" >  0.1 and  [=1] 1 hour "close - 1 candle ago close / 1 candle ago close * 100" <  2 and  daily close >  200 ) ) ) )`;

export const getChartinkSymbols = async () => {
  try {
    console.log('Fetching CSRF token from Chartink...');
    const getRes = await axios.get('https://chartink.com/screener', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    });
    
    const html = getRes.data;
    const csrfMatch = html.match(/<meta name="csrf-token" content="(.*?)"/);
    if (!csrfMatch) throw new Error('CSRF token not found');
    
    const csrfToken = csrfMatch[1];
    const cookies = getRes.headers['set-cookie'] ? getRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';
    
    console.log('Executing Chartink Scan...');
    const postRes = await axios.post('https://chartink.com/screener/process', 
      `scan_clause=${encodeURIComponent(SCAN_CLAUSE)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
          'Cookie': cookies,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Origin': 'https://chartink.com',
          'Referer': 'https://chartink.com/screener'
        }
      }
    );
    
    if (postRes.data && postRes.data.data) {
      const symbols = postRes.data.data.map(item => item.nsecode);
      console.log(`Chartink returned ${symbols.length} symbols:`, symbols);
      return symbols;
    }
    
    return [];
  } catch (err) {
    console.error('Chartink fetch error:', err.message);
    return [];
  }
};
