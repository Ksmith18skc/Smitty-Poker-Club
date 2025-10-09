const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PokerTable } = require('./game/PokerTable');

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

// Create tables map to store active tables
const tables = new Map();

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

// Initialize default tables
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

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let currentTableId = null;

  // Join table
  socket.on('join_table', async (data) => {
    try {
      // Validate input
      if (!data.tableId || !data.playerId || !data.playerName || typeof data.position !== 'number' || !data.buyIn) {
        throw new Error('Invalid join table data');
      }

      const table = tables.get(data.tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      // Check if player is already at another table
      if (currentTableId) {
        throw new Error('Already at another table');
      }

      // Join socket room
      socket.join(data.tableId);
      currentTableId = data.tableId;

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
  socket.on('leave_table', async (data) => {
    try {
      // Validate input
      if (!data.tableId || !data.playerId) {
        throw new Error('Invalid leave table data');
      }

      const table = tables.get(data.tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      // Get player data before removing
      const player = table.getPlayer(data.playerId);
      if (!player) {
        throw new Error('Player not found at table');
      }

      // Check if player can leave (not in active hand)
      if (table.phase !== 'waiting' && table.phase !== 'complete' && player.status === 'active') {
        throw new Error('Cannot leave during active hand');
      }

      // Remove player from table
      table.removePlayer(data.playerId);
      socket.leave(data.tableId);
      currentTableId = null;

      // Broadcast table state
      io.to(data.tableId).emit('table_state', table.getState());

      // Emit leave confirmation with final stack
      socket.emit('leave_confirmed', {
        finalStack: player.stack
      });
    } catch (error) {
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to leave table'
      });
    }
  });

  // Player action
  socket.on('player_action', (data) => {
    try {
      // Validate input
      if (!data.tableId || !data.playerId || !data.action) {
        throw new Error('Invalid action data');
      }

      const table = tables.get(data.tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      // Validate action
      if (!['fold', 'check', 'call', 'bet', 'raise'].includes(data.action)) {
        throw new Error('Invalid action type');
      }

      // Handle the action
      table.handleAction(data.playerId, data.action, data.amount);

      // Broadcast table state
      io.to(data.tableId).emit('table_state', table.getState());
    } catch (error) {
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to process action'
      });
    }
  });

  // Chat message
  socket.on('chat_message', (data) => {
    try {
      // Validate input
      if (!data.tableId || !data.message || !data.playerId || !data.playerName) {
        throw new Error('Invalid message data');
      }

      // Validate message length
      if (data.message.length > 500) {
        throw new Error('Message too long');
      }

      // Broadcast message to table
      io.to(data.tableId).emit('chat_message', {
        id: Date.now().toString(),
        playerId: data.playerId,
        playerName: data.playerName,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  });

  // Ping/Pong for connection monitoring
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // If player was at a table, remove them
    if (currentTableId) {
      const table = tables.get(currentTableId);
      if (table) {
        try {
          table.removePlayer(socket.id);
          io.to(currentTableId).emit('table_state', table.getState());
        } catch (error) {
          // Ignore errors during disconnect cleanup
          console.error('Error during disconnect cleanup:', error);
        }
      }
    }
  });
});

// API routes
app.get('/api/tables', (req, res) => {
  try {
    const tableList = Array.from(tables.values()).map(table => ({
      id: table.id,
      name: table.name,
      smallBlind: table.smallBlind,
      bigBlind: table.bigBlind,
      minBuyIn: table.minBuyIn,
      maxBuyIn: table.maxBuyIn,
      maxPlayers: table.maxPlayers,
      players: table.players.length,
      status: table.phase
    }));
    
    res.json(tableList);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get tables list'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Poker server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});