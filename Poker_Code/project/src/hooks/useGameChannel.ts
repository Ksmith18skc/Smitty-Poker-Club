import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { TestPlayer } from '../types/test';
import { Card } from '../types/poker';

interface UseGameChannelProps {
  tableId: string;
  playerId: string;
  playerName: string;
}

interface GameState {
  players: TestPlayer[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  dealerPosition: number;
  activePlayerIndex: number;
  gamePhase: string;
  handNumber: number;
}

export function useGameChannel({ tableId, playerId, playerName }: UseGameChannelProps) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [players, setPlayers] = useState<TestPlayer[]>([]);
  const [gameState, setGameState] = useState<Partial<GameState>>({});

  // Initialize Supabase presence channel
  useEffect(() => {
    const newChannel = supabase.channel(`table:${tableId}`, {
      config: {
        presence: {
          key: tableId,
        },
      },
    });

    // Handle presence state changes
    newChannel.on('presence', { event: 'sync' }, () => {
      const state = newChannel.presenceState();
      const presencePlayers = Object.values(state)
        .flat()
        .map((presence: any) => ({
          id: presence.user_id,
          name: presence.username,
          stack: presence.stack || 0,
          position: presence.position,
          status: presence.status || 'active',
          cards: presence.cards || [],
          bet: presence.bet || 0,
          totalBet: presence.totalBet || 0,
          lastAction: presence.lastAction,
          lastActionAmount: presence.lastActionAmount
        }))
        .filter(player => typeof player.position === 'number' && player.position >= 0);

      setPlayers(presencePlayers);
    });

    // Handle game state broadcasts
    newChannel.on('broadcast', { event: 'game_state' }, ({ payload }) => {
      setGameState(payload);
    });

    // Handle player actions
    newChannel.on('broadcast', { event: 'player_action' }, ({ payload }) => {
      if (payload.playerId !== playerId) {
        setGameState(prev => ({
          ...prev,
          ...payload.state
        }));
      }
    });

    // Handle connection status
    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);

        // Request current game state
        await newChannel.send({
          type: 'broadcast',
          event: 'request_state',
          payload: { requesterId: playerId }
        });
      } else {
        setIsConnected(false);
      }
    });

    setChannel(newChannel);

    return () => {
      newChannel.unsubscribe();
    };
  }, [tableId, playerId]);

  // Track player presence
  const trackPresence = useCallback(async (playerData: Partial<TestPlayer>) => {
    if (!channel) return;

    try {
      await channel.track({
        user_id: playerId,
        username: playerName,
        ...playerData,
        online_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking presence:', error);
      setError(error instanceof Error ? error : new Error('Failed to track presence'));
    }
  }, [channel, playerId, playerName]);

  // Update player data
  const updatePlayer = useCallback(async (playerData: Partial<TestPlayer>) => {
    if (!channel) return;

    try {
      await channel.track({
        user_id: playerId,
        username: playerName,
        ...playerData,
        last_update: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player data');
    }
  }, [channel, playerId, playerName]);

  // Broadcast game state
  const broadcastGameState = useCallback(async (state: Partial<GameState>) => {
    if (!channel) return;

    try {
      await channel.send({
        type: 'broadcast',
        event: 'game_state',
        payload: state
      });
    } catch (error) {
      console.error('Error broadcasting game state:', error);
      toast.error('Failed to update game state');
    }
  }, [channel]);

  // Leave table
  const leaveTable = useCallback(async () => {
    if (!channel) return;

    try {
      await channel.untrack();
      channel.unsubscribe();
      setIsConnected(false);
    } catch (error) {
      console.error('Error leaving table:', error);
      toast.error('Failed to leave table');
    }
  }, [channel]);

  // Broadcast action
  const broadcastAction = useCallback(async (action: string, data: any) => {
    if (!channel) return;

    try {
      await channel.send({
        type: 'broadcast',
        event: 'player_action',
        payload: {
          playerId,
          action,
          data,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Error broadcasting action:', error);
      toast.error('Failed to send action');
    }
  }, [channel, playerId]);

  return {
    isConnected,
    error,
    players,
    gameState,
    trackPresence,
    updatePlayer,
    broadcastGameState,
    leaveTable,
    broadcastAction
  };
}