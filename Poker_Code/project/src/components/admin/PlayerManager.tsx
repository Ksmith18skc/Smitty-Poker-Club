import React, { useState, useEffect } from 'react';
import { Search, Edit2, Ban, DollarSign, History, Download, RefreshCw, Repeat, AlertTriangle, UserPlus } from 'lucide-react';
import { PlayerService } from '../../services/playerService';
import { useAdminAudit } from '../../hooks/useAdminAudit';
import { formatTime } from '../../utils/formatters';
import { BalanceModificationDialog } from './BalanceModificationDialog';
import { TransactionHistoryDialog } from './TransactionHistoryDialog';
import { EditUserDialog } from './EditUserDialog';
import { CreateUserDialog } from './CreateUserDialog';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface Player {
  id: string;
  email: string;
  username: string;
  balance: number;
  lastActivity: Date;
  status: 'online' | 'offline';
}

export function PlayerManager() {
  const { logAction } = useAdminAudit();
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResyncConfirmation, setShowResyncConfirmation] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);

  useEffect(() => {
    const channel = supabase.channel('player-updates');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        fetchPlayers();
      })
      .subscribe();

    fetchPlayers();

    return () => {
      channel.unsubscribe();
    };
  }, [searchQuery]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);

      // Get players data using the regular API
      const { data: playersData, error: playersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          username,
          balance,
          created_at,
          status
        `)
        .ilike('username', `%${searchQuery}%`);

      if (playersError) throw playersError;

      // Get online status from presence state
      const presenceState = supabase.channel('online-users').presenceState();
      const onlineUsers = new Set(
        Object.values(presenceState)
          .flat()
          .map((presence: any) => presence.user_id)
      );

      // Format the players data
      const formattedPlayers = playersData?.map(player => ({
        id: player.id,
        email: player.email,
        username: player.username,
        balance: player.balance || 0,
        lastActivity: new Date(player.created_at),
        status: onlineUsers.has(player.id) ? 'online' as const : 'offline' as const
      })) || [];

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceModification = async (playerId: string, amount: number, reason: string) => {
    try {
      // First update the balance
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', playerId)
        .single();

      if (fetchError) throw fetchError;
      if (!user) throw new Error('User not found');

      const newBalance = (user.balance || 0) + amount;
      if (newBalance < 0) throw new Error('Insufficient balance');

      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', playerId);

      if (updateError) throw updateError;

      // Log the action
      await logAction({
        action: 'modify_balance',
        details: `Modified player balance by ${amount} - Reason: ${reason}`,
        targetId: playerId
      });

      // Also log to transactions
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: playerId,
          amount: amount,
          transaction_type: amount >= 0 ? 'credit' : 'debit',
          description: reason
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      toast.success('Balance updated successfully');
      fetchPlayers();
    } catch (error) {
      console.error('Error modifying balance:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update balance');
    }
  };

  const handleExport = () => {
    const csv = players.map(player => 
      `${player.username},${player.email},${player.balance},${player.status},${player.lastActivity}`
    ).join('\n');
    
    const blob = new Blob([`Username,Email,Balance,Status,Last Activity\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'player-balances.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    fetchPlayers();
    toast.success('Player list refreshed');
  };

  const handleResync = async () => {
    try {
      setIsResyncing(true);
      
      // Execute the SQL query to resync users
      const { error } = await supabase.rpc('admin_resync_users');
      
      if (error) throw error;
      
      // Log the action - using the current user's ID instead of "system"
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await logAction({
          action: 'resync_users',
          details: 'Resynced public.users with auth.users',
          targetId: user.id
        });
      }
      
      toast.success('Users resynced successfully');
      fetchPlayers();
      setShowResyncConfirmation(false);
    } catch (error) {
      console.error('Error resyncing users:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resync users');
    } finally {
      setIsResyncing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>
          <button
            onClick={() => setShowResyncConfirmation(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded transition flex items-center gap-2"
          >
            <Repeat size={18} />
            <span>Resync</span>
          </button>
          <button
            onClick={() => setShowCreateUserDialog(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition flex items-center gap-2"
          >
            <UserPlus size={18} />
            <span>Create User</span>
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition flex items-center gap-2"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="grid grid-cols-7 gap-4 p-3 border-b border-gray-700 text-gray-300 font-medium">
            <div>Username</div>
            <div>Email</div>
            <div>Balance</div>
            <div>Last Activity</div>
            <div>Status</div>
            <div>History</div>
            <div>Actions</div>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Loading players...
            </div>
          ) : (
            players.map((player) => (
              <div key={player.id} className="grid grid-cols-7 gap-4 p-3 border-b border-gray-700 text-gray-400">
                <div>{player.username}</div>
                <div className="truncate">{player.email}</div>
                <div className="font-mono">${player.balance.toLocaleString()}</div>
                <div>{formatTime(player.lastActivity, '24h')}</div>
                <div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    player.status === 'online' ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {player.status}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setSelectedPlayer(player);
                      setShowHistoryDialog(true);
                    }}
                    className="p-1 text-blue-400 hover:text-blue-300 transition"
                  >
                    <History size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPlayer(player);
                      setShowBalanceDialog(true);
                    }}
                    className="p-1 text-green-400 hover:text-green-300 transition"
                    title="Modify Balance"
                  >
                    <DollarSign size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedPlayer(player);
                      setShowEditDialog(true);
                    }}
                    className="p-1 text-blue-400 hover:text-blue-300 transition"
                    title="Edit User"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button className="p-1 text-red-400 hover:text-red-300 transition" title="Ban User">
                    <Ban size={18} />
                  </button>
                </div>
              </div>
            ))
          )}

          {!loading && players.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              No players found
            </div>
          )}
        </div>
      </div>

      {showBalanceDialog && selectedPlayer && (
        <BalanceModificationDialog
          player={selectedPlayer}
          onConfirm={handleBalanceModification}
          onClose={() => {
            setShowBalanceDialog(false);
            setSelectedPlayer(null);
          }}
        />
      )}

      {showHistoryDialog && selectedPlayer && (
        <TransactionHistoryDialog
          player={selectedPlayer}
          onClose={() => {
            setShowHistoryDialog(false);
            setSelectedPlayer(null);
          }}
        />
      )}

      {showEditDialog && selectedPlayer && (
        <EditUserDialog
          userId={selectedPlayer.id}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedPlayer(null);
          }}
          onUserUpdated={fetchPlayers}
        />
      )}

      {/* Create User Dialog */}
      {showCreateUserDialog && (
        <CreateUserDialog
          onClose={() => setShowCreateUserDialog(false)}
          onUserCreated={fetchPlayers}
        />
      )}

      {/* Resync Confirmation Dialog */}
      {showResyncConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isResyncing && setShowResyncConfirmation(false)} />
          <div className="relative bg-gray-800 w-[500px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
            <div className="bg-amber-700 p-3 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle size={18} />
                <span>Confirm User Resync</span>
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                This action will resync the public.users table with the current state of auth.users. It will:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-1">
                <li>Delete users from public.users that are no longer in auth.users</li>
                <li>Insert new users from auth.users into public.users</li>
              </ul>
              <p className="text-amber-400 mb-6">
                This is a potentially destructive operation. Are you sure you want to continue?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => !isResyncing && setShowResyncConfirmation(false)}
                  disabled={isResyncing}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResync}
                  disabled={isResyncing}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isResyncing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Resyncing...</span>
                    </>
                  ) : (
                    <>
                      <Repeat size={18} />
                      <span>Confirm Resync</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}