import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export interface TablePlayer {
  id: string;
  name: string;
  stack: number;
  position: number;
  status: 'active' | 'sitting_out' | 'away';
  avatar?: string;
  lastAction?: number;
}

export function useTablePlayers(tableId: string) {
  const [players, setPlayers] = useState<TablePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // Create a channel specifically for this table
    const channel = supabase.channel(`table:${tableId}`, {
      config: {
        presence: {
          key: tableId,
        },
      },
    });

    const handlePresenceSync = () => {
      const state = channel.presenceState();
      const activePlayers = Object.values(state)
        .flat()
        .map((presence: any) => ({
          id: presence.user_id,
          name: presence.username,
          stack: presence.stack,
          position: presence.position,
          status: presence.status,
          avatar: presence.avatar,
          lastAction: presence.last_action
        }))
        // Only include players who have been assigned a valid seat position
        .filter(player => typeof player.position === 'number' && player.position >= 0);

      setPlayers(activePlayers);
      setIsLoading(false);
    };

    const handlePlayerJoin = ({ newPresences }: { newPresences: any[] }) => {
      setPlayers(current => {
        const newPlayers = [...current];
        newPresences.forEach(presence => {
          // Only add player if they have a valid seat position
          if (typeof presence.position === 'number' && presence.position >= 0) {
            const playerIndex = newPlayers.findIndex(p => p.id === presence.user_id);
            const player = {
              id: presence.user_id,
              name: presence.username,
              stack: presence.stack,
              position: presence.position,
              status: presence.status,
              avatar: presence.avatar,
              lastAction: Date.now()
            };

            if (playerIndex === -1) {
              newPlayers.push(player);
            } else {
              newPlayers[playerIndex] = player;
            }
          }
        });
        return newPlayers;
      });
    };

    const handlePlayerLeave = ({ leftPresences }: { leftPresences: any[] }) => {
      setPlayers(current => {
        const playerIds = leftPresences.map(presence => presence.user_id);
        return current.filter(player => !playerIds.includes(player.id));
      });
    };

    const handlePlayerUpdate = ({ newPresences }: { newPresences: any[] }) => {
      setPlayers(current => {
        const newPlayers = [...current];
        newPresences.forEach(presence => {
          const playerIndex = newPlayers.findIndex(p => p.id === presence.user_id);
          if (playerIndex !== -1) {
            newPlayers[playerIndex] = {
              ...newPlayers[playerIndex],
              stack: presence.stack,
              status: presence.status,
              lastAction: Date.now()
            };
          }
        });
        return newPlayers;
      });
    };

    // Subscribe to channel events
    channel
      .on('presence', { event: 'sync' }, handlePresenceSync)
      .on('presence', { event: 'join' }, handlePlayerJoin)
      .on('presence', { event: 'leave' }, handlePlayerLeave)
      .on('broadcast', { event: 'player_update' }, handlePlayerUpdate)
      .subscribe();

    // Check for inactive players
    const checkInactivePlayers = () => {
      const now = Date.now();
      setPlayers(current =>
        current.map(player => {
          if (now - (player.lastAction || 0) > 30000) {
            return { ...player, status: 'away' };
          }
          return player;
        })
      );
    };

    timeout = setInterval(checkInactivePlayers, 5000);

    return () => {
      clearInterval(timeout);
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [tableId, user]);

  return { players, isLoading, error };
}