import React from 'react';
import { Minimize2, Square, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { UserBalance } from './UserBalance';

export function WindowHeader() {
  const { user } = useAuth();
  const displayName = user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="bg-blue-900 p-3 flex items-center justify-between">
      <h1 className="text-white font-semibold">Lobby - {displayName} logged in</h1>
      <div className="flex items-center gap-4">
        <UserBalance />
        <div className="flex gap-2">
          <button className="text-gray-300 hover:text-white">
            <Minimize2 size={18} />
          </button>
          <button className="text-gray-300 hover:text-white">
            <Square size={18} />
          </button>
          <button className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}