import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminAudit } from '../../hooks/useAdminAudit';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

interface CreateUserDialogProps {
  onClose: () => void;
  onUserCreated: () => void;
}

// Validation schemas
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters');
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export function CreateUserDialog({ onClose, onUserCreated }: CreateUserDialogProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { logAction } = useAdminAudit();

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
    
    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.password = error.errors[0].message;
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
      setIsCreating(true);

      // Call the Edge Function with properly formatted body
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: JSON.stringify({
          email,
          password,
          username
        })
      });

      if (error) throw error;
      if (!data) throw new Error('No response from create-user function');

      // Log the successful user creation
      await logAction({
        action: 'create_user',
        details: `Created user ${username} (${email})`,
        targetId: data.id
      });

      toast.success('User created successfully');
      onUserCreated();
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[500px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-green-800 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <UserPlus size={18} />
            <span>Create New User</span>
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username*
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border ${
                errors.username ? 'border-red-500' : 'border-gray-600'
              } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isCreating}
              required
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
              Email*
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isCreating}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password*
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border ${
                errors.password ? 'border-red-500' : 'border-gray-600'
              } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isCreating}
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.password}
              </p>
            )}
          </div>

          <div className="mt-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-200">
              New users will be created with a $0 balance. You can modify their balance after creation.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition flex items-center gap-2 disabled:opacity-50"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}