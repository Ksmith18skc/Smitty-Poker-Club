import React from 'react';
import { Search, FileText, Wallet2 } from 'lucide-react';
import { LogoutButton } from './LogoutButton';

export function BottomButtons() {
  return (
    <div className="grid grid-cols-4 gap-1 p-1 bg-gray-700">
      <button className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-gray-200 p-3 rounded transition">
        <Search size={18} />
        <span>Player Search</span>
      </button>
      <button className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-gray-200 p-3 rounded transition">
        <FileText size={18} />
        <span>Player Notes</span>
      </button>
      <button className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-gray-200 p-3 rounded transition">
        <Wallet2 size={18} />
        <span>Account Balance</span>
      </button>
      <LogoutButton />
    </div>
  );
}