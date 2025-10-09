import React, { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface CreateTableModalProps {
  onClose: () => void;
  onTableCreated: () => void;
}

// Define validation schema with exact allowed game types
const tableSchema = z.object({
  name: z.string().min(3, 'Table name must be at least 3 characters').max(100, 'Table name must be less than 100 characters'),
  maxPlayers: z.number().int().min(2, 'Minimum 2 players required').max(10, 'Maximum 10 players allowed'),
  minBuyIn: z.number().min(1, 'Minimum buy-in must be at least 1'),
  maxBuyIn: z.number().min(1, 'Maximum buy-in must be at least 1'),
  smallBlind: z.number().min(0.01, 'Small blind must be at least 0.01'),
  bigBlind: z.number().min(0.01, 'Big blind must be at least 0.01'),
  gameType: z.enum(['NL Hold\'em']), // Only allow Hold'em for test tables
  status: z.enum(['active', 'inactive']),
  visibility: z.enum(['public', 'private'])
});

export function CreateTableModal({ onClose, onTableCreated }: CreateTableModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    maxPlayers: 6, // Fixed for test tables
    minBuyIn: 10,
    maxBuyIn: 50,
    smallBlind: 0.25,
    bigBlind: 0.50,
    gameType: 'NL Hold\'em' as const,
    status: 'active' as const,
    visibility: 'public' as const
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert numeric inputs to numbers
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error for this field when it changes
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Check for duplicate table name
    if (name === 'name' && value.trim().length >= 3) {
      checkTableNameExists(value);
    }
  };

  const checkTableNameExists = async (name: string) => {
    setIsCheckingName(true);
    try {
      const { count, error } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .eq('name', name);

      if (error) throw error;

      if (count && count > 0) {
        setErrors({
          ...errors,
          name: 'Table name already exists'
        });
      }
    } catch (error) {
      console.error('Error checking table name:', error);
    } finally {
      setIsCheckingName(false);
    }
  };

  const validateForm = () => {
    try {
      // Additional validation
      if (formData.minBuyIn >= formData.maxBuyIn) {
        setErrors({
          ...errors,
          minBuyIn: 'Minimum buy-in must be less than maximum buy-in'
        });
        return false;
      }

      if (formData.smallBlind >= formData.bigBlind) {
        setErrors({
          ...errors,
          smallBlind: 'Small blind must be less than big blind'
        });
        return false;
      }

      // Validate using zod schema
      tableSchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the table in the database
      const { data, error } = await supabase
        .from('games')
        .insert({
          name: formData.name,
          game_type: formData.gameType,
          max_players: formData.maxPlayers,
          min_buy_in: formData.minBuyIn,
          max_buy_in: formData.maxBuyIn,
          small_blind: formData.smallBlind,
          big_blind: formData.bigBlind,
          status: formData.status,
          visibility: formData.visibility
        })
        .select()
        .single();

      if (error) throw error;

      // Log the action
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              amount: 0,
              transaction_type: 'admin_action',
              description: `Created test table: ${formData.name} (ID: ${data.id})`
            });
        }
      } catch (logError) {
        console.warn('Failed to log admin action:', logError);
      }

      toast.success('Test table created successfully');
      onTableCreated();
      onClose();
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create table');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[600px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Create New Test Table</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Table Name */}
            <div className="col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Table Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter table name"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.name}
                </p>
              )}
              {isCheckingName && (
                <p className="mt-1 text-sm text-gray-400">Checking name availability...</p>
              )}
            </div>

            {/* Buy-in Range */}
            <div>
              <label htmlFor="minBuyIn" className="block text-sm font-medium text-gray-300 mb-1">
                Minimum Buy-In*
              </label>
              <input
                id="minBuyIn"
                name="minBuyIn"
                type="number"
                min="1"
                step="0.01"
                value={formData.minBuyIn}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.minBuyIn ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.minBuyIn && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.minBuyIn}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="maxBuyIn" className="block text-sm font-medium text-gray-300 mb-1">
                Maximum Buy-In*
              </label>
              <input
                id="maxBuyIn"
                name="maxBuyIn"
                type="number"
                min="1"
                step="0.01"
                value={formData.maxBuyIn}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.maxBuyIn ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.maxBuyIn && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.maxBuyIn}
                </p>
              )}
            </div>

            {/* Blinds */}
            <div>
              <label htmlFor="smallBlind" className="block text-sm font-medium text-gray-300 mb-1">
                Small Blind*
              </label>
              <input
                id="smallBlind"
                name="smallBlind"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.smallBlind}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.smallBlind ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.smallBlind && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.smallBlind}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bigBlind" className="block text-sm font-medium text-gray-300 mb-1">
                Big Blind*
              </label>
              <input
                id="bigBlind"
                name="bigBlind"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.bigBlind}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.bigBlind ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.bigBlind && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.bigBlind}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                Table Status*
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.status}
                </p>
              )}
            </div>

            {/* Visibility */}
            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-1">
                Table Visibility*
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              {errors.visibility && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.visibility}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-200">
              This will create a new test table with the same functionality as the original Test Table.
              All game mechanics, player interactions, and testing features will be preserved.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition flex items-center gap-2 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Test Table</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}