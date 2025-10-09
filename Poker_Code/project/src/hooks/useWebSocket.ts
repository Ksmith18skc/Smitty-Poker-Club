import { useState, useEffect, useCallback } from 'react';
import { WebSocketService, GameEvent, GameState, ChatMessage } from '../lib/websocket';

interface UseWebSocketProps {
  tableId: string;
}

export function useWebSocket({ tableId }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [players, setPlayers] = useState<Set<string>>(new Set());

  // Create WebSocket service instance
  const ws = new WebSocketService();

  useEffect(() => {
    // Join table and set up event handlers
    ws.joinTable(tableId, {
      onPlayerJoined: (playerId) => {
        setPlayers((prev) => new Set([...prev, playerId]));
      },
      onPlayerLeft: (playerId) => {
        setPlayers((prev) => {
          const newPlayers = new Set(prev);
          newPlayers.delete(playerId);
          return newPlayers;
        });
      },
      onGameStateChanged: (state) => {
        setGameState(state);
      },
      onChatMessage: (message) => {
        setMessages((prev) => [...prev, message]);
      },
      onSystemNotification: (message) => {
        // Handle system notifications
        console.log('System notification:', message);
      }
    });

    // Update connection status
    const interval = setInterval(() => {
      setIsConnected(ws.isConnected());
      setQueueLength(ws.getQueueLength());
    }, 1000);

    return () => {
      clearInterval(interval);
      ws.leaveTable(tableId);
    };
  }, [tableId]);

  const sendMessage = useCallback(async (message: string) => {
    try {
      await ws.sendChatMessage(tableId, message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [tableId]);

  return {
    isConnected,
    queueLength,
    gameState,
    messages,
    players,
    sendMessage
  };
}