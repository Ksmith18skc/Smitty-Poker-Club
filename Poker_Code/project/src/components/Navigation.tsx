import React from 'react';
import { HelpCircle } from 'lucide-react';
import { HelpMenu } from './HelpMenu';
import { AccountButton } from './AccountButton';
import { OptionsButton } from './OptionsButton';

interface NavigationProps {
  helpMenuOpen: boolean;
  onHelpMenuToggle: () => void;
  onHelpMenuClose: () => void;
  onContactAdmin: () => void;
  onViewNews: () => void;
  onViewFaq: () => void;
}

export function Navigation({
  helpMenuOpen,
  onHelpMenuToggle,
  onHelpMenuClose,
  onContactAdmin,
  onViewNews,
  onViewFaq,
}: NavigationProps) {
  return (
    <div className="flex bg-gray-700">
      <button className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-500 transition">
        Lobby
      </button>
      <AccountButton />
      <OptionsButton />
      <div className="relative">
        <button 
          className="px-6 py-2 text-gray-300 hover:bg-gray-600 transition flex items-center gap-1"
          onClick={onHelpMenuToggle}
        >
          Help
          <HelpCircle size={16} />
        </button>
        <HelpMenu
          isOpen={helpMenuOpen}
          onClose={onHelpMenuClose}
          onContactAdmin={onContactAdmin}
          onViewNews={onViewNews}
          onViewFaq={onViewFaq}
        />
      </div>
    </div>
  );
}