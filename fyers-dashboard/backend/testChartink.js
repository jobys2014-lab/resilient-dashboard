import axios from 'axios';

async function testChartink() {
  try {
    const res = await axios.get('https://chartink.com/screener/option-intraday-11178');
    const html = res.data;
    
    console.log("HTML length:", html.length);
    const csrfMatch = html.match(/<meta name="csrf-token" content="(.*?)"/);
    console.log("CSRF Token:", csrfMatch ? csrfMatch[1] : 'not found');
    
    const scanJsonMatch = html.match(/:scan-json="(\{.*?\})"/);
    if (scanJsonMatch) {
      const scanJsonStr = scanJsonMatch[1].replace(/&quot;/g, '"');
      const scanJson = JSON.parse(scanJsonStr);
      console.log("Scan JSON ID:", scanJson.id);
      console.log("Scan JSON Atlas Query:", scanJson.atlas_query);
      console.log("Scan JSON Data:", Object.keys(scanJson));
    }
  } catch (err) {
    console.error("Error fetching:", err.message);
  }
}

testChartink();
