import { createClient } from '@supabase/supabase-js';
import { GameEngine } from './GameEngine';
import type { GameState, PlayerAction } from '../../types/poker';

export class WebSocketManager {
  private games: Map<string, GameEngine> = new Map();
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  constructor() {
    this.setupPresenceHandlers();
  }

  private setupPresenceHandlers(): void {
    this.supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync();
      })
      .subscribe();
  }

  private handlePresenceSync(): void {
    // Handle player presence changes
    const presenceState = this.supabase.channel('online-users').presenceState();
    
    // Update game states based on presence
    for (const [tableId, game] of this.games) {
      const tablePlayers = Object.values(presenceState)
        .flat()
        .filter((presence: any) => presence.tableId === tableId);

      if (tablePlayers.length < 2) {
        this.pauseGame(tableId);
      } else if (tablePlayers.length >= 2) {
        this.resumeGame(tableId);
      }
    }
  }

  async joinTable(
    tableId: string,
    playerId: string,
    position: number,
    buyIn: number
  ): Promise<void> {
    try {
      // Handle buy-in through Supabase RPC
      const { data, error } = await this.supabase.rpc('handle_table_buyin', {
        p_user_id: playerId,
        p_table_id: tableId,
        p_position: position,
        p_amount: buyIn
      });

      if (error) throw error;

      // Join presence channel
      const channel = this.supabase.channel(`table:${tableId}`);
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: playerId,
            position,
            stack: buyIn,
            status: 'active'
          });
        }
      });

      // Start or join game
      let game = this.games.get(tableId);
      if (!game) {
        game = new GameEngine(
          tableId,
          0.25, // Small blind
          0.50, // Big blind
          this.broadcastGameState.bind(this),
          this.handlePlayerTimeout.bind(this)
        );
        this.games.set(tableId, game);
      }

    } catch (error) {
      console.error('Error joining table:', error);
      throw error;
    }
  }

  async leaveTable(tableId: string, playerId: string): Promise<void> {
    const channel = this.supabase.channel(`table:${tableId}`);
    await channel.untrack();
    
    const game = this.games.get(tableId);
    if (game) {
      // Handle player leaving in game engine
      game.handleAction(playerId, 'fold');
    }
  }

  async performAction(
    tableId: string,
    playerId: string,
    action: PlayerAction,
    amount?: number
  ): Promise<void> {
    const game = this.games.get(tableId);
    if (!game) throw new Error('Game not found');

    game.handleAction(playerId, action, amount);
  }

  private async broadcastGameState(state: GameState): Promise<void> {
    const channel = this.supabase.channel(`table:${state.tableId}`);
    await channel.send({
      type: 'broadcast',
      event: 'game_state',
      payload: state
    });
  }

  private handlePlayerTimeout(playerId: string): void {
    // Auto-fold on timeout
    const game = this.findGameByPlayerId(playerId);
    if (game) {
      game.handleAction(playerId, 'fold');
    }
  }

  private findGameByPlayerId(playerId: string): GameEngine | undefined {
    for (const game of this.games.values()) {
      if (game.getState().players.some(p => p.id === playerId)) {
        return game;
      }
    }
  }

  private pauseGame(tableId: string): void {
    const game = this.games.get(tableId);
    if (game) {
      // Save game state and pause
      this.games.delete(tableId);
    }
  }

  private resumeGame(tableId: string): void {
    if (!this.games.has(tableId)) {
      // Restore game state and resume
      const game = new GameEngine(
        tableId,
        0.25,
        0.50,
        this.broadcastGameState.bind(this),
        this.handlePlayerTimeout.bind(this)
      );
      this.games.set(tableId, game);
    }
  }
}