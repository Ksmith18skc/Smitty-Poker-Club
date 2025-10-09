import { useMemo } from 'react';

interface PokerTable {
  id: string;
  gameType: string;
  stakes: string;
  buyIn: string;
  seats: number;
  playing: number;
}

interface Filters {
  filterEnabled: boolean;
  gameTypes: Record<string, boolean>;
  stakes: {
    min: string;
    max: string;
  };
  buyIn: {
    min: string;
    max: string;
  };
  seats: {
    min: string;
    max: string;
  };
  players: {
    min: string;
  };
  visibility: {
    hideFull: boolean;
  };
}

export function useFilters(tables: PokerTable[], filters: Filters | null) {
  return useMemo(() => {
    if (!filters?.filterEnabled) {
      return tables;
    }

    return tables.filter(table => {
      // Game type filters
      if (Object.values(filters.gameTypes).some(Boolean)) {
        const gameTypeMap: Record<string, string> = {
          holdem: 'NL Hold\'em',
          omaha: 'PL Omaha',
          omahaHiLo: 'PL Omaha-5 Hi-Lo',
          mixed: 'Mixed Choice',
        };

        const matchesGameType = Object.entries(filters.gameTypes)
          .some(([key, value]) => value && gameTypeMap[key] === table.gameType);

        if (!matchesGameType) return false;
      }

      // Stakes filter
      if (filters.stakes.min && parseFloat(table.stakes.split('/')[0]) < parseFloat(filters.stakes.min)) {
        return false;
      }
      if (filters.stakes.max && parseFloat(table.stakes.split('/')[1]) > parseFloat(filters.stakes.max)) {
        return false;
      }

      // Buy-in filter
      const [minBuyIn, maxBuyIn] = table.buyIn.split(' - ').map(v => parseFloat(v));
      if (filters.buyIn.min && minBuyIn < parseFloat(filters.buyIn.min)) {
        return false;
      }
      if (filters.buyIn.max && maxBuyIn > parseFloat(filters.buyIn.max)) {
        return false;
      }

      // Seats filter
      if (filters.seats.min && table.seats < parseInt(filters.seats.min)) {
        return false;
      }
      if (filters.seats.max && table.seats > parseInt(filters.seats.max)) {
        return false;
      }

      // Players filter
      if (filters.players.min && table.playing < parseInt(filters.players.min)) {
        return false;
      }

      // Visibility filters
      if (filters.visibility.hideFull && table.playing >= table.seats) {
        return false;
      }

      return true;
    });
  }, [tables, filters]);
}