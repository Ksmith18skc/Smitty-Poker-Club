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
  }
});

// Store active tables
const tables = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let currentTableId = null;

  // Join table
  socket.on('joinTable', async (tableId) => {
    try {
      // Join socket room for this table
      socket.join(tableId);
      currentTableId = tableId;

      // Get or create table
      let table = tables.get(tableId);
      if (!table) {
        table = new PokerTable(tableId);
        tables.set(tableId, table);
      }

      // Send current table state to the new player
      socket.emit('tableState', table.getState());
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Player joins with seat
  socket.on('playerJoined', async ({ tableId, player }) => {
    try {
      const table = tables.get(tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      // Add player to table
      table.addPlayer(player);

      // Broadcast updated table state to all players
      io.to(tableId).emit('tableState', table.getState());
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Player leaves
  socket.on('playerLeft', async ({ tableId, playerId }) => {
    try {
      const table = tables.get(tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      // Remove player from table
      table.removePlayer(playerId);

      // Broadcast updated table state
      io.to(tableId).emit('tableState', table.getState());

      // Clean up empty tables
      if (table.getPlayers().length === 0) {
        tables.delete(tableId);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Table state update
  socket.on('tableUpdate', (state) => {
    try {
      const table = tables.get(state.id);
      if (!table) {
        throw new Error('Table not found');
      }

      // Update table state
      table.updateState(state);

      // Broadcast to all players except sender
      socket.broadcast.to(state.id).emit('tableState', table.getState());
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (currentTableId) {
      const table = tables.get(currentTableId);
      if (table) {
        table.removePlayer(socket.id);
        io.to(currentTableId).emit('tableState', table.getState());

        if (table.getPlayers().length === 0) {
          tables.delete(currentTableId);
        }
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Poker server running on port ${PORT}`);
});