import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { z } from 'zod';

// Event type definitions
export type GameEvent = 
  | { type: 'player_joined'; playerId: string; tableId: string }
  | { type: 'player_left'; playerId: string; tableId: string }
  | { type: 'game_state_changed'; tableId: string; state: GameState }
  | { type: 'chat_message'; tableId: string; message: ChatMessage }
  | { type: 'system_notification'; message: string };

export interface GameState {
  currentPlayer: string;
  pot: number;
  communityCards: string[];
  players: {
    id: string;
    name: string;
    stack: number;
    bet: number;
    folded: boolean;
  }[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: string;
}

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1).max(500),
  tableId: z.string().uuid()
});

export class WebSocketService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageQueue: GameEvent[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    // Initialize Supabase realtime client
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    supabase.realtime.onOpen(() => {
      console.log('WebSocket connection established');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.processMessageQueue();
    });

    supabase.realtime.onClose(() => {
      console.log('WebSocket connection closed');
      this.isConnected = false;
      this.handleReconnect();
    });

    supabase.realtime.onError((error) => {
      console.error('WebSocket error:', error);
      this.handleError(error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      supabase.realtime.connect();
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  private handleError(error: Error) {
    // Implement error handling logic
    console.error('WebSocket error:', error);
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const event = this.messageQueue.shift();
      if (event) {
        this.broadcast(event);
      }
    }
  }

  /**
   * Join a poker table channel
   * @param tableId The table ID to join
   * @param callbacks Event callbacks for the table
   */
  joinTable(
    tableId: string,
    callbacks: {
      onPlayerJoined?: (playerId: string) => void;
      onPlayerLeft?: (playerId: string) => void;
      onGameStateChanged?: (state: GameState) => void;
      onChatMessage?: (message: ChatMessage) => void;
      onSystemNotification?: (message: string) => void;
    }
  ) {
    if (this.channels.has(tableId)) {
      console.warn(`Already joined table ${tableId}`);
      return;
    }

    const channel = supabase.channel(`table:${tableId}`)
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach(presence => {
          if (callbacks.onPlayerJoined) {
            callbacks.onPlayerJoined(presence.player_id);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach(presence => {
          if (callbacks.onPlayerLeft) {
            callbacks.onPlayerLeft(presence.player_id);
          }
        });
      })
      .on('broadcast', { event: 'game_state' }, ({ payload }) => {
        if (callbacks.onGameStateChanged) {
          callbacks.onGameStateChanged(payload as GameState);
        }
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (callbacks.onChatMessage) {
          callbacks.onChatMessage(payload as ChatMessage);
        }
      })
      .on('broadcast', { event: 'system' }, ({ payload }) => {
        if (callbacks.onSystemNotification) {
          callbacks.onSystemNotification(payload.message);
        }
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const presenceTrackStatus = await channel.track({
          online_at: new Date().toISOString(),
        });
        console.log('Presence track status:', presenceTrackStatus);
      }
    });

    this.channels.set(tableId, channel);
  }

  /**
   * Leave a poker table channel
   * @param tableId The table ID to leave
   */
  leaveTable(tableId: string) {
    const channel = this.channels.get(tableId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(tableId);
    }
  }

  /**
   * Send a chat message
   * @param tableId The table ID
   * @param message The message to send
   */
  async sendChatMessage(tableId: string, message: string) {
    try {
      // Validate input
      const validatedData = chatMessageSchema.parse({ message, tableId });

      const channel = this.channels.get(tableId);
      if (!channel) {
        throw new Error('Not connected to table');
      }

      const event: GameEvent = {
        type: 'chat_message',
        tableId: validatedData.tableId,
        message: {
          id: crypto.randomUUID(),
          playerId: supabase.auth.getUser().then(({ data }) => data.user?.id || ''),
          playerName: 'Player', // TODO: Get actual player name
          message: validatedData.message,
          timestamp: new Date().toISOString()
        }
      };

      if (this.isConnected) {
        await channel.send({
          type: 'broadcast',
          event: 'chat',
          payload: event
        });
      } else {
        this.messageQueue.push(event);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Broadcast a game state update
   * @param event The game event to broadcast
   */
  private async broadcast(event: GameEvent) {
    try {
      const channel = this.channels.get(event.type === 'system_notification' ? 'system' : event.tableId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      await channel.send({
        type: 'broadcast',
        event: event.type,
        payload: event
      });
    } catch (error) {
      console.error('Error broadcasting event:', error);
      throw error;
    }
  }

  /**
   * Get the connection status
   * @returns boolean indicating if connected
   */
  isConnected() {
    return this.isConnected;
  }

  /**
   * Get the number of queued messages
   * @returns number of queued messages
   */
  getQueueLength() {
    return this.messageQueue.length;
  }
}