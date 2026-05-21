import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { setupWebSocket } from './websocket.js';
import { fyersRouter } from './fyers.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// FYERS API endpoints
app.use('/api/fyers', fyersRouter);

// WebSocket for live data & scanner signals
setupWebSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
