import React, { useState, useRef, useEffect } from 'react';
import { Settings, Maximize, Volume2, FileText } from 'lucide-react';
import { DisplaySettings } from './options/DisplaySettings';
import { SoundSettings } from './options/SoundSettings';
import { PlayerNotes } from './options/PlayerNotes';
import { useFullscreen } from '../hooks/useFullscreen';

export function OptionsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'display' | 'sound' | 'notes' | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActivePanel(null);
      }
    }

    function handleKeyPress(event: KeyboardEvent) {
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        setActivePanel(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [toggleFullscreen]);

  const handleOptionClick = (panel: 'display' | 'sound' | 'notes') => {
    setActivePanel(panel);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-2 text-gray-300 hover:bg-gray-600 transition flex items-center gap-2"
        aria-label="Options"
      >
        <Settings size={18} />
        <span>Options</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-1 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
          role="menu"
        >
          <div className="py-1">
            <button
              onClick={toggleFullscreen}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition"
              role="menuitem"
            >
              <Maximize size={18} />
              <span>Fullscreen {isFullscreen ? '(On)' : '(Off)'}</span>
            </button>

            <button
              onClick={() => handleOptionClick('display')}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition"
              role="menuitem"
            >
              <Settings size={18} />
              <span>Display Settings</span>
            </button>

            <button
              onClick={() => handleOptionClick('sound')}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition"
              role="menuitem"
            >
              <Volume2 size={18} />
              <span>Sound Effects</span>
            </button>

            <button
              onClick={() => handleOptionClick('notes')}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition"
              role="menuitem"
            >
              <FileText size={18} />
              <span>Player Notes</span>
            </button>
          </div>
        </div>
      )}

      {activePanel === 'display' && (
        <DisplaySettings onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'sound' && (
        <SoundSettings onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'notes' && (
        <PlayerNotes onClose={() => setActivePanel(null)} />
      )}
    </div>
  );
}