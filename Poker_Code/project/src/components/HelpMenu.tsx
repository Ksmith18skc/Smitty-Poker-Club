import React, { useState } from 'react';
import { HelpCircle, Mail, FileText, HelpingHand, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';

interface HelpMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdmin: () => void;
  onViewNews: () => void;
  onViewFaq: () => void;
}

export function HelpMenu({ isOpen, onClose, onContactAdmin, onViewNews, onViewFaq }: HelpMenuProps) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const { user } = useAuth();

  const handleAdminLoginSuccess = () => {
    setShowAdminLogin(false);
    setShowAdminDashboard(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50">
        <div className="py-1">
          <button
            onClick={onContactAdmin}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <Mail size={16} />
            <span>Contact Site Administrator...</span>
          </button>
          <button
            onClick={onViewNews}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <FileText size={16} />
            <span>View Site News...</span>
          </button>
          <button
            onClick={onViewFaq}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <HelpingHand size={16} />
            <span>View Site FAQ...</span>
          </button>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <ShieldCheck size={16} />
            <span>Admin Login</span>
          </button>
        </div>
      </div>

      {showAdminLogin && (
        <AdminLogin
          onSuccess={handleAdminLoginSuccess}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {showAdminDashboard && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
        />
      )}
    </>
  );
}