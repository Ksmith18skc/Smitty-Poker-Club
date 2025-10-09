import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  queueLength: number;
}

export function ConnectionStatus({ isConnected, queueLength }: ConnectionStatusProps) {
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg flex items-center gap-2 ${
      isConnected ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {isConnected ? (
        <>
          <Wifi size={18} className="text-white" />
          <span className="text-white">Connected</span>
          {queueLength > 0 && (
            <span className="text-white text-sm">({queueLength} queued)</span>
          )}
        </>
      ) : (
        <>
          <WifiOff size={18} className="text-white" />
          <span className="text-white">Disconnected</span>
        </>
      )}
    </div>
  );
}