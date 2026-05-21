import WebSocket from 'ws';
import fs from 'fs';

const ws = new WebSocket('ws://localhost:5000');

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'MARKET_DATA') {
    fs.writeFileSync('market_data_dump.json', JSON.stringify(msg.payload, null, 2));
    console.log('Successfully wrote market_data_dump.json. Checking for issues...');
    let issues = 0;
    msg.payload.forEach(stock => {
      if (stock.currentPrice === undefined || stock.currentPrice === null) {
        console.error(`ERROR: ${stock.symbol} has undefined/null currentPrice!`);
        issues++;
      }
      if (isNaN(stock.currentPrice)) {
        console.error(`ERROR: ${stock.symbol} has NaN currentPrice!`);
        issues++;
      }
      if (!stock.history || stock.history.length === 0) {
        console.warn(`WARNING: ${stock.symbol} has empty history!`);
        issues++;
      }
    });
    console.log(`Check complete. Found ${issues} issues.`);
    process.exit(0);
  }
});

ws.on('error', (err) => {
  console.error('WS Connection error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout waiting for message');
  process.exit(1);
}, 5000);
