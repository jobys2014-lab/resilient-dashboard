import fyersApi from 'fyers-api-v3';
import dotenv from 'dotenv';
dotenv.config();

const appId = process.env.FYERS_APP_ID;
const token = process.argv[2]; // Pass token as argument

console.log("Testing with token:", token ? token.substring(0, 15) + "..." : "NONE");

const SocketClass = fyersApi.fyersDataSocket || fyersApi;
// Test 1: Just token
const fyersSocket = new SocketClass(token);

fyersSocket.on('connect', () => {
  console.log('Connected to FYERS Live Market Data');
  fyersSocket.subscribe(['NSE:SBIN-EQ', 'NSE:RELIANCE-EQ']);
});

fyersSocket.on('message', (message) => {
  console.log('Received message:', JSON.stringify(message).substring(0, 150));
});

fyersSocket.on('error', (err) => {
  console.error('Socket Error:', err);
});

fyersSocket.on('close', () => {
  console.log('Socket Closed');
});

fyersSocket.connect();

setTimeout(() => {
  console.log('Timeout reached, closing test.');
  process.exit(0);
}, 10000);
