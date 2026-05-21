# Resilient Trader Terminal Dashboard

A professional multi-chart dashboard for traders, featuring live wiggling price ticks, technical indicator alerts, sector indices tracking, and options/futures scanners.

---

## 🚀 How to Setup and Run

Follow these simple steps to run the dashboard on your machine:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (LTS version recommended).

### 2. Download / Clone the Repository
If you are setting this up on a new computer:
```bash
git clone https://github.com/jobys2014-lab/resilient-dashboard.git
cd resilient-dashboard
```

### 3. Install Dependencies
Run the installation command inside both the **frontend** and **backend** directories:

*   **For Backend:**
    ```bash
    cd fyers-dashboard/backend
    npm install
    ```
*   **For Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

### 4. Configure Environment Variables
Create a file named `.env` inside the `fyers-dashboard/backend/` directory and add your credentials:
```env
FYERS_APP_ID=YOUR_APP_ID
FYERS_SECRET_KEY=YOUR_SECRET_KEY
FYERS_REDIRECT_URI=http://localhost:5000/api/fyers/callback
PORT=5000
```

### 5. Launch the Dashboard
To start both the frontend and backend servers together:
*   Double-click the `start.bat` file in the root of the project folder.
*   Or run the script from the terminal:
    ```bash
    ./start.bat
    ```

The dashboard will open automatically in your browser at:
*   **Local Address:** `http://localhost:3000`
*   **Network Address (for other devices on your Wi-Fi):** `http://<your-local-ip>:3000`

---

## 🛠️ Features

*   **Live Price Action:** Real-time 1-second price ticks and chart updates.
*   **Sector Marquee:** Continuous scrolling banner of major indices (NIFTY 50, BANK NIFTY, IT, AUTO, etc.) with pause-on-hover.
*   **Advanced Analytics:** Interactive Futures Price vs. OI Scatter bubble chart and Relative Rotation Graph (RRG).
*   **Scanners:** Real-time momentum, breakout, and reversal alerts.
