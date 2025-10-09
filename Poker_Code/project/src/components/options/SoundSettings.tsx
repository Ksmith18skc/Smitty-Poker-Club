import React, { useState } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface SoundSettingsProps {
  onClose: () => void;
}

interface SoundSettings {
  masterVolume: number;
  isMuted: boolean;
  sounds: {
    gameActions: boolean;
    uiInteractions: boolean;
    notifications: boolean;
    chat: boolean;
    cards: boolean;
    chips: boolean;
  };
  volumes: {
    gameActions: number;
    uiInteractions: number;
    notifications: number;
    chat: number;
    cards: number;
    chips: number;
  };
}

const defaultSettings: SoundSettings = {
  masterVolume: 100,
  isMuted: false,
  sounds: {
    gameActions: true,
    uiInteractions: true,
    notifications: true,
    chat: true,
    cards: true,
    chips: true,
  },
  volumes: {
    gameActions: 100,
    uiInteractions: 80,
    notifications: 90,
    chat: 85,
    cards: 95,
    chips: 90,
  },
};

export function SoundSettings({ onClose }: SoundSettingsProps) {
  const [settings, setSettings] = useLocalStorage<SoundSettings>('soundSettings', defaultSettings);
  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    setSettings(tempSettings);
    onClose();
  };

  const toggleMute = () => {
    setTempSettings({ ...tempSettings, isMuted: !tempSettings.isMuted });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[500px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Sound Settings</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white font-medium">Master Volume</label>
              <button
                onClick={toggleMute}
                className="text-gray-300 hover:text-white p-1 rounded transition"
              >
                {tempSettings.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tempSettings.masterVolume}
              onChange={(e) => setTempSettings({ ...tempSettings, masterVolume: parseInt(e.target.value) })}
              className="w-full"
              disabled={tempSettings.isMuted}
            />
            <div className="text-gray-400 text-sm mt-1">{tempSettings.masterVolume}%</div>
          </div>

          <div className="space-y-4">
            {Object.entries(tempSettings.sounds).map(([key, enabled]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white font-medium flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        sounds: {
                          ...tempSettings.sounds,
                          [key]: e.target.checked
                        }
                      })}
                      className="text-blue-500 rounded"
                    />
                    {key.split(/(?=[A-Z])/).join(' ')}
                  </label>
                </div>
                {enabled && (
                  <>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempSettings.volumes[key as keyof typeof tempSettings.volumes]}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        volumes: {
                          ...tempSettings.volumes,
                          [key]: parseInt(e.target.value)
                        }
                      })}
                      className="w-full"
                      disabled={tempSettings.isMuted}
                    />
                    <div className="text-gray-400 text-sm mt-1">
                      {tempSettings.volumes[key as keyof typeof tempSettings.volumes]}%
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-700 p-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}