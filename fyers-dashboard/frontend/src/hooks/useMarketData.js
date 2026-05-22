import { useState, useEffect } from 'react';

export function useMarketData() {
  const [marketData, setMarketData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let isMounted = true;

    function connect() {
      const host = window.location.hostname || 'localhost';
      const wsUrl = import.meta.env.VITE_WS_URL || `ws://${host}:5000`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}...`);
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MARKET_DATA') {
            setMarketData(data.payload);
          } else if (data.type === 'SCANNER_ALERTS') {
            setAlerts(prev => {
              // Merge new alerts at the top, keep max 50
              const newAlerts = data.payload.filter(newA => !prev.find(p => p.symbol === newA.symbol && p.time === newA.time));
              return [...newAlerts, ...prev].slice(0, 50);
            });
          }
        } catch (err) {
          console.error('Error parsing websocket data', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        console.log('WebSocket closed. Reconnecting in 2 seconds...');
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return { marketData, alerts };
}
