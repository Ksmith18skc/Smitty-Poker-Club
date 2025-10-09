import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Play, Pause } from 'lucide-react';
import { useAdminAudit } from '../../hooks/useAdminAudit';

export function TournamentsManager() {
  const { logAction } = useAdminAudit();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  const handleCreateTournament = async (tournamentData: any) => {
    try {
      // API call to create tournament
      await logAction({
        action: 'create_tournament',
        details: `Created tournament: ${tournamentData.name}`,
        targetId: 'new_tournament_id'
      });
      
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Tournaments Management</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Create Tournament</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="grid grid-cols-7 gap-4 p-3 border-b border-gray-700 text-gray-300 font-medium">
            <div>Tournament Name</div>
            <div>Type</div>
            <div>Buy-in</div>
            <div>Players</div>
            <div>Start Time</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          
          {/* Sample tournament row */}
          <div className="grid grid-cols-7 gap-4 p-3 border-b border-gray-700 text-gray-400">
            <div>Sunday Special</div>
            <div>NL Hold'em</div>
            <div>$100+10</div>
            <div>156/200</div>
            <div>2025-02-25 20:00</div>
            <div>Registering</div>
            <div className="flex gap-2">
              <button className="p-1 text-green-400 hover:text-green-300 transition">
                <Play size={18} />
              </button>
              <button className="p-1 text-blue-400 hover:text-blue-300 transition">
                <Edit2 size={18} />
              </button>
              <button className="p-1 text-red-400 hover:text-red-300 transition">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}