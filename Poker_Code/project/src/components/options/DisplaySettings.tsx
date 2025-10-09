import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';

interface DisplaySettingsProps {
  onClose: () => void;
}

export function DisplaySettings({ onClose }: DisplaySettingsProps) {
  const { settings, updateSettings } = useDisplaySettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(settings) !== JSON.stringify(tempSettings);
  }, [settings, tempSettings]);

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    updateSettings(tempSettings);
    onClose();
  };

  const handleConfirmClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-gray-800 w-[500px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Display Settings</h2>
          <button onClick={handleClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-white mb-2">Theme</label>
            <div className="space-y-2">
              {['light', 'dark', 'custom'].map((theme) => (
                <label key={theme} className="flex items-center gap-2 text-gray-300">
                  <input
                    type="radio"
                    checked={tempSettings.theme === theme}
                    onChange={() => setTempSettings({ ...tempSettings, theme: theme as 'light' | 'dark' | 'custom' })}
                    className="text-blue-500"
                  />
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white mb-2">Font Size</label>
            <div className="space-y-2">
              {['small', 'normal', 'large'].map((size) => (
                <label key={size} className="flex items-center gap-2 text-gray-300">
                  <input
                    type="radio"
                    checked={tempSettings.fontSize === size}
                    onChange={() => setTempSettings({ ...tempSettings, fontSize: size as 'small' | 'normal' | 'large' })}
                    className="text-blue-500"
                  />
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white mb-2">UI Scale</label>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.1"
              value={tempSettings.uiScale}
              onChange={(e) => setTempSettings({ ...tempSettings, uiScale: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-gray-400 text-sm mt-1">{Math.round(tempSettings.uiScale * 100)}%</div>
          </div>

          <div>
            <label className="block text-white mb-2">Time Format</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  checked={tempSettings.timeFormat === '12h'}
                  onChange={() => setTempSettings({ ...tempSettings, timeFormat: '12h' })}
                  className="text-blue-500"
                />
                12-hour
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  checked={tempSettings.timeFormat === '24h'}
                  onChange={() => setTempSettings({ ...tempSettings, timeFormat: '24h' })}
                  className="text-blue-500"
                />
                24-hour
              </label>
            </div>
          </div>

          <div>
            <label className="block text-white mb-2">Number Format</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  checked={tempSettings.numberFormat === 'comma'}
                  onChange={() => setTempSettings({ ...tempSettings, numberFormat: 'comma' })}
                  className="text-blue-500"
                />
                1,234.56
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  checked={tempSettings.numberFormat === 'dot'}
                  onChange={() => setTempSettings({ ...tempSettings, numberFormat: 'dot' })}
                  className="text-blue-500"
                />
                1.234,56
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={tempSettings.chatTimestamps}
                onChange={(e) => setTempSettings({ ...tempSettings, chatTimestamps: e.target.checked })}
                className="text-blue-500 rounded"
              />
              Show chat timestamps
            </label>
          </div>
        </div>

        <div className="bg-gray-700 p-3 flex justify-end gap-2">
          <button
            onClick={handleClose}
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

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center z-[60]">
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Unsaved Changes</h3>
              <p className="text-gray-300 mb-6">
                You have unsaved changes. Are you sure you want to close without saving?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}