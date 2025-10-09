import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TableState, PlayerAction } from '../types/poker';

interface UsePokerGameProps {
  tableId: string;
  playerId: string;
  playerName: string;
}

export function usePokerGame({ tableId, playerId, playerName }: UsePokerGameProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('error', (error: { message: string }) => {
      setError(new Error(error.message));
    });

    newSocket.on('table_state', (state: TableState) => {
      setTableState(state);
    });

    newSocket.on('chat_message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinTable = useCallback((position: number, buyIn: number) => {
    if (!socket) return Promise.reject(new Error('Socket not connected'));

    return new Promise<void>((resolve, reject) => {
      socket.emit('join_table', {
        tableId,
        playerId,
        playerName,
        position,
        buyIn
      });

      // Set up a one-time listener for errors
      const errorHandler = (error: { message: string }) => {
        socket.off('error', errorHandler);
        reject(new Error(error.message));
      };

      // Set up a one-time listener for successful table state update
      const tableStateHandler = () => {
        socket.off('table_state', tableStateHandler);
        socket.off('error', errorHandler);
        resolve();
      };

      socket.once('error', errorHandler);
      socket.once('table_state', tableStateHandler);
    });
  }, [socket, tableId, playerId, playerName]);

  const leaveTable = useCallback(() => {
    if (!socket) return Promise.reject(new Error('Socket not connected'));

    return new Promise<void>((resolve, reject) => {
      socket.emit('leave_table', {
        tableId,
        playerId
      });

      // Set up a one-time listener for errors
      const errorHandler = (error: { message: string }) => {
        socket.off('error', errorHandler);
        reject(new Error(error.message));
      };

      // Set up a one-time listener for successful table state update
      const tableStateHandler = () => {
        socket.off('table_state', tableStateHandler);
        socket.off('error', errorHandler);
        resolve();
      };

      socket.once('error', errorHandler);
      socket.once('table_state', tableStateHandler);
    });
  }, [socket, tableId, playerId]);

  const performAction = useCallback((action: PlayerAction, amount?: number) => {
    if (!socket) throw new Error('Socket not connected');

    socket.emit('player_action', {
      tableId,
      playerId,
      action,
      amount
    });
  }, [socket, tableId, playerId]);

  const sendMessage = useCallback((message: string) => {
    if (!socket) throw new Error('Socket not connected');

    socket.emit('chat_message', {
      tableId,
      playerId,
      playerName,
      message
    });
  }, [socket, tableId, playerId, playerName]);

  return {
    tableState,
    error,
    isConnected,
    queueLength,
    chatMessages,
    joinTable,
    leaveTable,
    performAction,
    sendMessage
  };
}