import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, RefreshCw } from 'lucide-react';
import { TableService } from '../../services/tableService';
import { useAdminAudit } from '../../hooks/useAdminAudit';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { CreateTableModal } from './CreateTableModal';

interface Table {
  id: string;
  name: string;
  game_type: string;
  max_players: number;
  min_buy_in: number;
  max_buy_in: number;
  small_blind: number;
  big_blind: number;
  status: string;
  visibility?: string;
  created_at: string;
  players_count?: number;
}

export function RingGamesManager() {
  const { logAction } = useAdminAudit();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tablesExist, setTablesExist] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch without setting loading state
    fetchTables(false);
    
    // Set up real-time subscription to tables
    const subscription = supabase
      .channel('games-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'games' }, 
        () => {
          // Refresh tables when changes occur, without loading state
          fetchTables(false);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkTablesExist = async () => {
    try {
      // Check if the games table exists
      const { error } = await supabase
        .from('games')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          setTablesExist(false);
          setErrorMessage("The 'games' table doesn't exist in the database. Create a new table to set up the schema.");
          return false;
        }
        throw error;
      }

      setTablesExist(true);
      return true;
    } catch (error) {
      console.error('Error checking tables existence:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to check if tables exist');
      return false;
    }
  };

  const fetchTables = async (showLoading = true) => {
    // Only show loading indicator when manually refreshing
    if (showLoading) {
      setIsLoading(true);
    }
    
    // Check if tables exist first
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      setIsLoading(false);
      return;
    }
    
    try {
      setErrorMessage(null);
      
      // Use a direct query to the games table
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get player counts for each table
      const tablesWithPlayerCounts = (data || []).map(table => {
        return {
          ...table,
          players_count: 0 // Placeholder count
        };
      });

      setTables(tablesWithPlayerCounts);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load tables');
      if (showLoading) {
        toast.error('Failed to load tables');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTable = async () => {
    setShowCreateModal(true);
  };

  const handleTableCreated = () => {
    setTablesExist(true);
    setErrorMessage(null);
    fetchTables(false);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      await logAction({
        action: 'delete_table',
        details: 'Deleted ring game table',
        targetId: tableId
      });

      toast.success('Table deleted successfully');
      fetchTables(false);
    } catch (error) {
      console.error('Error deleting table:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete table');
      toast.error('Failed to delete table');
    }
  };

  const formatStakes = (smallBlind: number, bigBlind: number) => {
    return `$${smallBlind.toFixed(2)}/$${bigBlind.toFixed(2)}`;
  };

  const formatBuyIn = (minBuyIn: number, maxBuyIn: number) => {
    return `$${minBuyIn} - $${maxBuyIn}`;
  };

  const handleRefresh = () => {
    // Only show loading state when manually refreshing
    fetchTables(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Ring Games Management</h3>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>
          <button
            onClick={handleCreateTable}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create New Table</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {errorMessage && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4 text-red-200">
            <p className="font-medium">Error:</p>
            <p>{errorMessage}</p>
          </div>
        )}
        
        {!tablesExist ? (
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 text-center">
            <h3 className="text-xl font-medium text-white mb-4">Tables Database Not Set Up</h3>
            <p className="text-gray-400 mb-6">
              The tables database schema hasn't been created yet. Click the button below to create a new table and set up the required database schema.
            </p>
            <button
              onClick={handleCreateTable}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              <span>Create First Table</span>
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg border border-gray-700">
            <div className="grid grid-cols-9 gap-4 p-3 border-b border-gray-700 text-gray-300 font-medium">
              <div>Table Name</div>
              <div>Game Type</div>
              <div>Stakes</div>
              <div>Buy In</div>
              <div>Players</div>
              <div>Max Players</div>
              <div>Status</div>
              <div>Visibility</div>
              <div>Actions</div>
            </div>
            
            {loading ? (
              <div className="p-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Loading tables...</span>
              </div>
            ) : (
              tables.map((table) => (
                <div key={table.id} className="grid grid-cols-9 gap-4 p-3 border-b border-gray-700 text-gray-400">
                  <div>{table.name}</div>
                  <div>{table.game_type}</div>
                  <div>{formatStakes(table.small_blind, table.big_blind)}</div>
                  <div>{formatBuyIn(table.min_buy_in, table.max_buy_in)}</div>
                  <div>{table.players_count || 0}/{table.max_players}</div>
                  <div>{table.max_players}</div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      table.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {table.status}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      table.visibility === 'public' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
                    }`}>
                      {table.visibility || 'public'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-400 hover:text-blue-300 transition">
                      <Eye size={18} />
                    </button>
                    <button className="p-1 text-blue-400 hover:text-blue-300 transition">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}

            {!loading && tables.length === 0 && (
              <div className="p-4 text-center text-gray-400">
                No tables found. Create a new table to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTableModal
          onClose={() => setShowCreateModal(false)}
          onTableCreated={handleTableCreated}
        />
      )}
    </div>
  );
}