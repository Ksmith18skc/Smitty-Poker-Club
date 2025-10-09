import React, { useState } from 'react';
import { X, Users, DollarSign, Trophy, Activity } from 'lucide-react';
import { RingGamesManager } from './RingGamesManager';
import { TournamentsManager } from './TournamentsManager';
import { PlayerManager } from './PlayerManager';
import { AdminAuditLog } from './AdminAuditLog';

interface AdminDashboardProps {
  onClose: () => void;
}

type ActiveView = 'ring-games' | 'tournaments' | 'players' | 'audit';

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<ActiveView>('ring-games');

  const handleClose = () => {
    // Clear admin session on close
    sessionStorage.removeItem('adminSession');
    onClose();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'ring-games':
        return <RingGamesManager />;
      case 'tournaments':
        return <TournamentsManager />;
      case 'players':
        return <PlayerManager />;
      case 'audit':
        return <AdminAuditLog />;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-gray-800 w-[1200px] h-[800px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Admin Dashboard</h2>
          <button onClick={handleClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-[200px_1fr] h-[calc(100%-48px)]">
          {/* Sidebar */}
          <div className="bg-gray-900 border-r border-gray-700 p-2 space-y-1">
            <button
              onClick={() => setActiveView('ring-games')}
              className={`w-full px-4 py-2 rounded text-left flex items-center gap-2 transition ${
                activeView === 'ring-games'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <DollarSign size={18} />
              <span>Ring Games</span>
            </button>
            <button
              onClick={() => setActiveView('tournaments')}
              className={`w-full px-4 py-2 rounded text-left flex items-center gap-2 transition ${
                activeView === 'tournaments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Trophy size={18} />
              <span>Tournaments</span>
            </button>
            <button
              onClick={() => setActiveView('players')}
              className={`w-full px-4 py-2 rounded text-left flex items-center gap-2 transition ${
                activeView === 'players'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Users size={18} />
              <span>Players</span>
            </button>
            <button
              onClick={() => setActiveView('audit')}
              className={`w-full px-4 py-2 rounded text-left flex items-center gap-2 transition ${
                activeView === 'audit'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Activity size={18} />
              <span>Audit Log</span>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-hidden">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}