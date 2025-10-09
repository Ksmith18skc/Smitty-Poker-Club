import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any local storage data
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-gray-200 p-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Logging out...</span>
        </>
      ) : (
        <>
          <LogOut size={18} />
          <span>Logout</span>
        </>
      )}
    </button>
  );
}