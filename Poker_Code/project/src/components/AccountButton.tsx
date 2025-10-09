import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Wallet, UserCog } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface AccountButtonProps {
  className?: string;
}

export function AccountButton({ className = '' }: AccountButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      fetchBalance();
    }
  }, [isOpen, user]);

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.clear();
      sessionStorage.clear();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('users')
        .update({ username: newDisplayName.trim() })
        .eq('id', user.id);

      if (error) throw error;
      setIsEditingName(false);
      setNewDisplayName('');
    } catch (error) {
      console.error('Error updating display name:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-6 py-2 text-gray-300 hover:bg-gray-600 transition flex items-center gap-2 ${className}`}
      >
        <User size={18} />
        <span>Account</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-1 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
          style={{
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto'
          }}
        >
          {/* Balance Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between text-gray-300">
              <span>Balance:</span>
              <span className="font-bold text-green-400">
                {balance !== null ? `$${balance.toFixed(2)}` : 'Loading...'}
              </span>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="p-4 border-b border-gray-700">
            {isEditingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Enter new display name"
                  className="w-full px-3 py-2 bg-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={30}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={isLoading || !newDisplayName.trim()}
                    className="flex-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="flex-1 bg-gray-600 text-gray-200 px-3 py-1 rounded hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 flex items-center gap-2 rounded transition"
              >
                <UserCog size={18} />
                <span>Change Display Name</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => fetchBalance()}
              className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition"
            >
              <Wallet size={18} />
              <span>Refresh Balance</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition disabled:opacity-50"
            >
              <LogOut size={18} />
              <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}