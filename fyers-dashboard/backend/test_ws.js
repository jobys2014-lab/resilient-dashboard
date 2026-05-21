import WebSocket from 'ws';

console.log('Connecting to ws://localhost:5000...');
const ws = new WebSocket('ws://localhost:5000');

ws.on('open', () => {
  console.log('CONNECTED TO WEBSOCKET!');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('RECEIVED MESSAGE TYPE:', msg.type);
  if (msg.payload) {
    console.log('PAYLOAD LENGTH:', msg.payload.length);
    if (msg.payload.length > 0) {
      console.log('FIRST ITEM SYMBOL:', msg.payload[0].symbol);
      console.log('FIRST ITEM PRICE:', msg.payload[0].currentPrice);
    }
  }
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('CONNECTION ERROR:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout waiting for message');
  process.exit(1);
}, 5000);
