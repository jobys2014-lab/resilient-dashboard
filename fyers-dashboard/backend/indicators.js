// Technical Indicator Calculations

// 1. Calculate Simple Moving Average (SMA)
export function calculateSMA(data, period) {
  if (!data || data.length < period) return Array(data.length).fill(null);
  const sma = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
    sma.push(null);
  }
  sma[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period].close + data[i].close;
    sma.push(sum / period);
  }
  return sma;
}

// 2. Calculate Exponential Moving Average (EMA)
export function calculateEMA(data, period) {
  if (!data || data.length < period) return Array(data.length).fill(null);
  const ema = [];
  const k = 2 / (period + 1);
  
  // First value is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
    ema.push(null);
  }
  let currentEma = sum / period;
  ema[period - 1] = currentEma;

  for (let i = period; i < data.length; i++) {
    currentEma = data[i].close * k + currentEma * (1 - k);
    ema.push(currentEma);
  }
  return ema;
}

// 3. Calculate Relative Strength Index (RSI)
export function calculateRSI(data, period = 14) {
  if (!data || data.length <= period) return Array(data.length).fill(50);
  const rsi = Array(data.length).fill(50);
  
  let gains = 0;
  let losses = 0;

  // First change
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

// 4. Calculate MACD (12, 26, 9)
export function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  const result = Array(data.length).fill({ macd: '0.00', signal: '0.00', hist: '0.00' });
  if (!data || data.length < longPeriod) return result;

  const ema12 = calculateEMA(data, shortPeriod);
  const ema26 = calculateEMA(data, longPeriod);
  
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (ema12[i] === null || ema26[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }

  // Calculate Signal line (EMA9 of MACD Line)
  // To use calculateEMA, we wrap macdLine in object format
  const macdData = macdLine.map(v => ({ close: v || 0 }));
  const signalLine = calculateEMA(macdData, signalPeriod);

  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null || i < longPeriod + signalPeriod) {
      // Keep default
    } else {
      const macd = macdLine[i];
      const sig = signalLine[i];
      const hist = macd - sig;
      result[i] = {
        macd: macd.toFixed(2),
        signal: sig.toFixed(2),
        hist: hist.toFixed(2)
      };
    }
  }
  return result;
}

// 5. Calculate Bollinger Bands
export function calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
  const result = Array(data.length).fill({ upper: null, middle: null, lower: null });
  if (!data || data.length < period) return result;

  const middleBand = calculateSMA(data, period);

  for (let i = period - 1; i < data.length; i++) {
    const mean = middleBand[i];
    let sumSqDiff = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSqDiff += Math.pow(data[j].close - mean, 2);
    }
    const stdDev = Math.sqrt(sumSqDiff / period);
    result[i] = {
      upper: mean + stdDevMultiplier * stdDev,
      middle: mean,
      lower: mean - stdDevMultiplier * stdDev
    };
  }
  return result;
}

// 6. Calculate Parabolic SAR
export function calculateParabolicSAR(data, step = 0.02, maxStep = 0.2) {
  const sar = Array(data.length).fill(null);
  if (!data || data.length < 2) return sar;

  // Initialize
  let isLong = data[1].close > data[0].close;
  let sarVal = isLong ? data[0].low : data[0].high;
  let ep = isLong ? data[1].high : data[1].low;
  let af = step;

  sar[0] = sarVal;
  sar[1] = sarVal;

  for (let i = 2; i < data.length; i++) {
    const prevSar = sarVal;
    sarVal = prevSar + af * (ep - prevSar);

    if (isLong) {
      // SAR cannot be higher than yesterday's or today's low
      sarVal = Math.min(sarVal, data[i - 1].low, data[i].low);
      
      if (data[i].high > ep) {
        ep = data[i].high;
        af = Math.min(af + step, maxStep);
      }
      
      // Check for trend reversal
      if (data[i].close < sarVal) {
        isLong = false;
        sarVal = ep; // New SAR is the EP of the long trend
        ep = data[i].low;
        af = step;
      }
    } else {
      // SAR cannot be lower than yesterday's or today's high
      sarVal = Math.max(sarVal, data[i - 1].high, data[i].high);
      
      if (data[i].low < ep) {
        ep = data[i].low;
        af = Math.min(af + step, maxStep);
      }
      
      // Check for trend reversal
      if (data[i].close > sarVal) {
        isLong = true;
        sarVal = ep; // New SAR is the EP of the short trend
        ep = data[i].high;
        af = step;
      }
    }
    sar[i] = sarVal;
  }
  return sar;
}
