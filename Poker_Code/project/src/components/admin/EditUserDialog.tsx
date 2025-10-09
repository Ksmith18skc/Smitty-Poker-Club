import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminAudit } from '../../hooks/useAdminAudit';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

interface EditUserDialogProps {
  userId: string;
  onClose: () => void;
  onUserUpdated: () => void;
}

// Validation schemas
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters');
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').optional();

export function EditUserDialog({ userId, onClose, onUserUpdated }: EditUserDialogProps) {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { logAction } = useAdminAudit();

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user data from public.users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setUser(data);
      setUsername(data.username || '');
      setEmail(data.email || '');
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      usernameSchema.parse(username);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.username = error.errors[0].message;
      }
    }
    
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.email = error.errors[0].message;
      }
    }
    
    if (password) {
      try {
        passwordSchema.parse(password);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.password = error.errors[0].message;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      const updates: Record<string, any> = {};
      const changes: string[] = [];
      
      // Check what fields have changed
      if (username !== user.username) {
        updates.username = username;
        changes.push('username');
      }
      
      if (email !== user.email) {
        updates.email = email;
        changes.push('email');
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        // Update public.users table
        const { error: publicUpdateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', userId);
        
        if (publicUpdateError) throw publicUpdateError;
      }
      
      // Log the action
      if (changes.length > 0 || password) {
        await logAction({
          action: 'update_user',
          details: `Updated user: ${[...changes, password ? 'password' : ''].filter(Boolean).join(', ')}`,
          targetId: userId
        });
        
        toast.success('User updated successfully');
        onUserUpdated();
      } else {
        toast.info('No changes to save');
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[500px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Edit User</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.username ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={isSaving}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={isSaving}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.email}
                </p>
              )}
              <p className="mt-1 text-xs text-amber-400">
                Note: Email changes will only update in the public.users table, not in auth.users
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter new password"
                disabled={isSaving}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.password}
                </p>
              )}
              <p className="mt-1 text-xs text-amber-400">
                Note: Password changes are not supported in this version
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition flex items-center gap-2 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}