import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PokerTable } from './game/PokerTable';
import { PlayerAction } from './types/poker';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const tables = new Map<string, PokerTable>();

// Create some default tables
const defaultTables = [
  {
    id: 'table1',
    name: 'Beginner\'s Table',
    smallBlind: 0.25,
    bigBlind: 0.50,
    minBuyIn: 10,
    maxBuyIn: 50
  },
  {
    id: 'table2',
    name: 'Medium Stakes',
    smallBlind: 0.50,
    bigBlind: 1,
    minBuyIn: 20,
    maxBuyIn: 100
  },
  {
    id: 'table3',
    name: 'High Rollers',
    smallBlind: 1,
    bigBlind: 2,
    minBuyIn: 50,
    maxBuyIn: 200
  }
];

defaultTables.forEach(config => {
  tables.set(config.id, new PokerTable(
    config.id,
    config.name,
    config.smallBlind,
    config.bigBlind,
    config.minBuyIn,
    config.maxBuyIn
  ));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join table
  socket.on('join_table', async (data: {
    tableId: string;
    playerId: string;
    playerName: string;
    buyIn: number;
    position: number;
  }) => {
    try {
      const table = tables.get(data.tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      // Join socket room
      socket.join(data.tableId);

      // Add player to table
      table.addPlayer(
        data.playerId,
        data.playerName,
        data.buyIn,
        data.position
      );

      // Broadcast table state
      io.to(data.tableId).emit('table_state', table.getState());
    } catch (error) {
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to join table'
      });
    }
  });

  // Leave table
  socket.on('leave_table', (data: {
    tableId: string;
    playerId: string;
  }) => {
    try {
      const table = tables.get(data.tableId);
      if (!table) {
      }
    }
  }
  )
}
)