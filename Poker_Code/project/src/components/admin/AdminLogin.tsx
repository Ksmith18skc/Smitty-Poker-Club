import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

interface AdminLoginProps {
  onSuccess: () => void;
  onClose: () => void;
}

const adminLoginSchema = z.object({
  email: z.literal('korysmith@arizona.edu', {
    errorMap: () => ({ message: 'Only korysmith@arizona.edu is allowed to login as admin' })
  }),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export function AdminLogin({ onSuccess, onClose }: AdminLoginProps) {
  const [email, setEmail] = useState('korysmith@arizona.edu');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      // Validate input format
      adminLoginSchema.parse({ email, password });

      // Attempt login with Supabase directly
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error('Invalid credentials');
      }

      if (!data.user) {
        throw new Error('Authentication failed');
      }

      // Verify this is the admin user
      if (data.user.email !== 'korysmith@arizona.edu') {
        throw new Error('Unauthorized access');
      }

      // Create a simple admin session in localStorage
      const sessionData = {
        userId: data.user.id,
        email: data.user.email,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      };

      // Store session
      sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
      
      // Log the admin login (best effort)
      try {
        // Use transactions table for logging admin login
        await supabase
          .from('transactions')
          .insert({
            user_id: data.user.id,
            amount: 0,
            transaction_type: 'admin_action',
            description: `Admin login from ${window.location.hostname}`
          });
      } catch (logError) {
        console.warn('Failed to log admin login:', logError);
      }

      onSuccess();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[400px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Admin Login</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={true}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}