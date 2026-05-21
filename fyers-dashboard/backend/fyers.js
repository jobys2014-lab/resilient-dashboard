import express from 'express';
import { fyersModel } from 'fyers-api-v3';

export const fyersRouter = express.Router();
const fyers = new fyersModel();

let globalAccessToken = null;
export const getAccessToken = () => globalAccessToken;

fyersRouter.get('/login-url', (req, res) => {
  fyers.setAppId(process.env.FYERS_APP_ID);
  fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URI);
  
  const loginUrl = fyers.generateAuthCode();
  res.json({ success: true, url: loginUrl });
});

fyersRouter.get('/callback', async (req, res) => {
  const authCode = req.query.auth_code;
  
  if (!authCode) {
    return res.status(400).send('Authentication failed: No auth code found.');
  }

  try {
    fyers.setAppId(process.env.FYERS_APP_ID);
    
    const reqBody = {
      client_id: process.env.FYERS_APP_ID,
      secret_key: process.env.FYERS_SECRET_KEY,
      auth_code: authCode
    };
    
    const response = await fyers.generate_access_token(reqBody);
    
    if (response.s === 'ok') {
      globalAccessToken = response.access_token;
      fyers.setAccessToken(globalAccessToken);
      res.send(`
        <html>
          <body style="background:#0f172a; color:#22c55e; font-family:sans-serif; text-align:center; margin-top:50px;">
            <h2>FYERS Login Successful!</h2>
            <p>Access Token generated and saved to backend.</p>
            <p>You can close this tab and return to the dashboard.</p>
          </body>
        </html>
      `);
    } else {
      res.status(500).json(response);
    }
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).send('Internal Server Error');
  }
});

fyersRouter.get('/status', (req, res) => {
  res.json({ connected: !!globalAccessToken });
});

fyersRouter.get('/fo-list', (req, res) => {
  // We'll still return the mock list for the UI, 
  // but in reality you'd fetch the master contract list and filter for F&O
  res.json({
    symbols: ['NSE:RELIANCE-EQ', 'NSE:SBIN-EQ', 'NSE:TCS-EQ', 'NSE:INFY-EQ', 'NSE:HDFCBANK-EQ']
  });
});

