import React, { useState } from 'react';
import { X } from 'lucide-react';

interface FilterPanelProps {
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
}

interface FilterState {
  gameTypes: {
    holdem: boolean;
    omaha: boolean;
    omahaHiLo: boolean;
    omahaX: boolean;
    omahaXHiLo: boolean;
    razz: boolean;
    stud: boolean;
    studHiLo: boolean;
    mixed: boolean;
  };
  limits: {
    noLimit: boolean;
    potLimit: boolean;
    capLimit: boolean;
    fixed: boolean;
  };
  stakes: {
    min: string;
    max: string;
  };
  buyIn: {
    min: string;
    max: string;
  };
  seats: {
    min: string;
    max: string;
  };
  players: {
    min: string;
  };
  visibility: {
    hideFull: boolean;
    hidePrivate: boolean;
  };
  filterEnabled: boolean;
}

const initialState: FilterState = {
  gameTypes: {
    holdem: false,
    omaha: false,
    omahaHiLo: false,
    omahaX: false,
    omahaXHiLo: false,
    razz: false,
    stud: false,
    studHiLo: false,
    mixed: false,
  },
  limits: {
    noLimit: false,
    potLimit: false,
    capLimit: false,
    fixed: false,
  },
  stakes: {
    min: '',
    max: '',
  },
  buyIn: {
    min: '',
    max: '',
  },
  seats: {
    min: '',
    max: '',
  },
  players: {
    min: '',
  },
  visibility: {
    hideFull: false,
    hidePrivate: false,
  },
  filterEnabled: false,
};

export function FilterPanel({ onClose, onApplyFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>(initialState);

  const handleCheckboxChange = (category: keyof FilterState, key: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as keyof typeof prev[typeof category]],
      },
    }));
  };

  const handleInputChange = (category: keyof FilterState, key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleReset = () => {
    setFilters(initialState);
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[600px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Ring Game Filter</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Game Types */}
            <div className="space-y-2">
              <h3 className="text-white font-medium mb-3">Game</h3>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.holdem}
                  onChange={() => handleCheckboxChange('gameTypes', 'holdem')}
                  className="rounded border-gray-600"
                />
                Hold'em
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.omaha}
                  onChange={() => handleCheckboxChange('gameTypes', 'omaha')}
                  className="rounded border-gray-600"
                />
                Omaha
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.omahaHiLo}
                  onChange={() => handleCheckboxChange('gameTypes', 'omahaHiLo')}
                  className="rounded border-gray-600"
                />
                Omaha Hi-Lo
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.omahaX}
                  onChange={() => handleCheckboxChange('gameTypes', 'omahaX')}
                  className="rounded border-gray-600"
                />
                Omaha-X
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.omahaXHiLo}
                  onChange={() => handleCheckboxChange('gameTypes', 'omahaXHiLo')}
                  className="rounded border-gray-600"
                />
                Omaha-X Hi-Lo
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.razz}
                  onChange={() => handleCheckboxChange('gameTypes', 'razz')}
                  className="rounded border-gray-600"
                />
                Razz
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.stud}
                  onChange={() => handleCheckboxChange('gameTypes', 'stud')}
                  className="rounded border-gray-600"
                />
                Stud
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.studHiLo}
                  onChange={() => handleCheckboxChange('gameTypes', 'studHiLo')}
                  className="rounded border-gray-600"
                />
                StudHiLo
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.gameTypes.mixed}
                  onChange={() => handleCheckboxChange('gameTypes', 'mixed')}
                  className="rounded border-gray-600"
                />
                Mixed
              </label>
            </div>

            {/* Limits */}
            <div>
              <h3 className="text-white font-medium mb-3">Limit</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.limits.noLimit}
                    onChange={() => handleCheckboxChange('limits', 'noLimit')}
                    className="rounded border-gray-600"
                  />
                  No Limit
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.limits.potLimit}
                    onChange={() => handleCheckboxChange('limits', 'potLimit')}
                    className="rounded border-gray-600"
                  />
                  Pot Limit
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.limits.capLimit}
                    onChange={() => handleCheckboxChange('limits', 'capLimit')}
                    className="rounded border-gray-600"
                  />
                  Cap Limit
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.limits.fixed}
                    onChange={() => handleCheckboxChange('limits', 'fixed')}
                    className="rounded border-gray-600"
                  />
                  Fixed
                </label>
              </div>

              <h3 className="text-white font-medium mt-6 mb-3">Stakes</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 w-8">Min</span>
                  <input
                    type="text"
                    value={filters.stakes.min}
                    onChange={(e) => handleInputChange('stakes', 'min', e.target.value)}
                    className="bg-gray-700 text-gray-200 rounded px-2 py-1 w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 w-8">Max</span>
                  <input
                    type="text"
                    value={filters.stakes.max}
                    onChange={(e) => handleInputChange('stakes', 'max', e.target.value)}
                    className="bg-gray-700 text-gray-200 rounded px-2 py-1 w-24"
                  />
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div>
              <h3 className="text-white font-medium mb-3">Buy In</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 w-8">Min</span>
                  <input
                    type="text"
                    value={filters.buyIn.min}
                    onChange={(e) => handleInputChange('buyIn', 'min', e.target.value)}
                    className="bg-gray-700 text-gray-200 rounded px-2 py-1 w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 w-8">Max</span>
                  <input
                    type="text"
                    value={filters.buyIn.max}
                    onChange={(e) => handleInputChange('buyIn', 'max', e.target.value)}
                    className="bg-gray-700 text-gray-200 rounded px-2 py-1 w-24"
                  />
                </div>
              </div>

              <h3 className="text-white font-medium mt-6 mb-3">Seats</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 w-8">Min</span>
                  <input
                    type="text"
                    value={filters.seats.min}
                    onChange={(e) => handleInputChange('seats', 'min', e.target.value)}
                    className="bg-gray-700 text-gray-200 rounded px-2 py-1 w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 w-8">Max</span>
                  <input
                    type="text"
                    value={filters.seats.max}
                    onChange={(e) => handleInputChange('seats', 'max', e.target.value)}
                    className="bg-gray-700 text-gray-200 rounded px-2 py-1 w-24"
                  />
                </div>
              </div>

              <h3 className="text-white font-medium mt-6 mb-3">Players</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-300 w-8">Min</span>
                <input
                  type="text"
                  value={filters.players.min}
                  onChange={(e) => handleInputChange('players', 'min', e.target.value)}
                  className="bg-gray-700 text-gray-200 rounded px-2 py-1 w-24"
                />
              </div>
            </div>
          </div>

          {/* Visibility Options */}
          <div className="mt-6 space-y-2">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={filters.visibility.hideFull}
                onChange={() => handleCheckboxChange('visibility', 'hideFull')}
                className="rounded border-gray-600"
              />
              Hide full
            </label>
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={filters.visibility.hidePrivate}
                onChange={() => handleCheckboxChange('visibility', 'hidePrivate')}
                className="rounded border-gray-600"
              />
              Hide private
            </label>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={filters.filterEnabled}
                onChange={() => handleCheckboxChange('filterEnabled', 'filterEnabled')}
                className="rounded border-gray-600"
              />
              Filter Enabled
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-700 p-3 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
          >
            Reset all
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}