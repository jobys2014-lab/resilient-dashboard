import React from 'react';
import ChartGrid from '../components/ChartGrid';
import ScannerTable from '../components/ScannerTable';

const Dashboard = ({ timeframe, marketData, alerts }) => {
  return (
    <main className="flex flex-1 gap-2 overflow-hidden">
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <ChartGrid timeframe={timeframe} marketData={marketData} alerts={alerts} />
      </div>
      <div className="w-80 flex flex-col gap-2 shrink-0">
        <ScannerTable alerts={alerts} marketData={marketData} />
      </div>
    </main>
  );
};

export default Dashboard;
