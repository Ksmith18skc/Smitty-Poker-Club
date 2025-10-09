import React, { useState, useCallback, useEffect } from 'react';
import { WindowHeader } from '../components/WindowHeader';
import { Navigation } from '../components/Navigation';
import { StatsBar } from '../components/StatsBar';
import { RingGamesTable } from '../components/RingGamesTable';
import { BottomButtons } from '../components/BottomButtons';
import { PokerTableModal } from '../modals/PokerTableModal';
import { TableInfoPanel } from '../components/TableInfoPanel';
import { FilterPanel } from '../components/FilterPanel';
import { OnlinePlayersList } from '../components/OnlinePlayersList';
import { useTableHandlers } from '../hooks/useTableHandlers';
import { useFilters } from '../hooks/useFilters';
import { TestPokerTable } from '../components/poker/test/TestPokerTable';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

type GameType = 'NL Hold\'em' | 'PL Omaha' | 'PL Courchevel' | 'PL Omaha-5 Hi-Lo' | 'Mixed Choice';

interface Tournament {
  id: string;
  name: string;
  gameType: GameType;
  buyIn: string;
  tableSize: number;
  registered: string;
  maxPlayers: number;
  startTime: string;
  status: string;
}

interface SitAndGoTournament {
  id: string;
  name: string;
  gameType: GameType;
  buyIn: string;
  tableSize: number;
  registered: string;
  status: string;
  maxPlayers: number;
}

interface PokerTable {
  id: string;
  name: string;
  gameType: GameType;
  stakes: string;
  buyIn: string;
  seats: number;
  playing: number;
  waiting: number;
}

export function Lobby() {
  const [activeView, setActiveView] = useState<'lobby' | 'ring-games' | 'tournaments' | 'sitngos'>('ring-games');
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<PokerTable | null>(null);
  const [highlightedTableId, setHighlightedTableId] = useState<string | null>(null);
  const [showTableInfo, setShowTableInfo] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [loginTime] = useState(() => new Date());
  const [showTestTable, setShowTestTable] = useState(false);
  const [tables, setTables] = useState<PokerTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  const tournaments: Tournament[] = [
    {
      id: 'T1',
      name: '$75 NIGHTLY FREEROLL!',
      gameType: 'NL Hold\'em',
      buyIn: '0+0',
      tableSize: 8,
      registered: '0/800',
      maxPlayers: 800,
      startTime: 'Playing: 32/47',
      status: 'in_progress'
    },
    {
      id: 'T2',
      name: 'SUNDAY 8PM EST PRIZE NIGHT!!',
      gameType: 'NL Hold\'em',
      buyIn: '0+0+R',
      tableSize: 8,
      registered: '21/800',
      maxPlayers: 800,
      startTime: '@ Feb 23 06:00 pm',
      status: 'registration_open'
    },
    {
      id: 'T3',
      name: '$25 WINNER-TAKE-ALL FREEROLL!',
      gameType: 'NL Hold\'em',
      buyIn: '0+0',
      tableSize: 8,
      registered: '1/800',
      maxPlayers: 800,
      startTime: '@ Feb 22 12:00 pm',
      status: 'registration_open'
    }
  ];

  const sitAndGoTournaments: SitAndGoTournament[] = [
    {
      id: 'SNG1',
      name: '$10+1 NL Hold\'em Sit N\'Go',
      gameType: 'NL Hold\'em',
      buyIn: '10+1',
      tableSize: 9,
      registered: '1/9',
      status: '@ starts when full',
      maxPlayers: 9
    },
    {
      id: 'SNG2',
      name: '$10+1 PL Omaha Sit N\'Go',
      gameType: 'PL Omaha',
      buyIn: '10+1',
      tableSize: 9,
      registered: '0/9',
      status: '@ starts when full',
      maxPlayers: 9
    },
    {
      id: 'SNG3',
      name: '$20+2 NL Hold\'em Sit N\'Go',
      gameType: 'NL Hold\'em',
      buyIn: '20+2',
      tableSize: 9,
      registered: '0/9',
      status: '@ starts when full',
      maxPlayers: 9
    },
    {
      id: 'SNG4',
      name: '$20+2 PL Omaha Sit N\'Go',
      gameType: 'PL Omaha',
      buyIn: '20+2',
      tableSize: 9,
      registered: '0/9',
      status: '@ starts when full',
      maxPlayers: 9
    }
  ];

  // Add the test table to the tables list
  const testTable: PokerTable = { 
    id: '2.7', 
    name: 'Test Table', 
    gameType: 'NL Hold\'em', 
    stakes: '0.25/0.50', 
    buyIn: '10 - 50', 
    seats: 6, 
    playing: 0, 
    waiting: 0 
  };

  // Fetch tables from the database
  const fetchTables = useCallback(async () => {
    setIsLoadingTables(true);
    setTableError(null);
    
    try {
      // Fetch tables from the games table
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our PokerTable interface
      const formattedTables: PokerTable[] = data.map(game => ({
        id: game.id,
        name: game.name,
        gameType: game.game_type as GameType,
        stakes: `${game.small_blind}/${game.big_blind}`,
        buyIn: `${game.min_buy_in} - ${game.max_buy_in}`,
        seats: game.max_players,
        playing: 0, // We'll update this with real data in the future
        waiting: 0  // We'll update this with real data in the future
      }));
      
      // Add the test table to the list
      setTables([testTable, ...formattedTables]);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTableError(error instanceof Error ? error.message : 'Failed to load tables');
      toast.error('Failed to load tables');
      
      // Fallback to just the test table if there's an error
      setTables([testTable]);
    } finally {
      setIsLoadingTables(false);
    }
  }, []);

  // Set up real-time subscription to tables
  useEffect(() => {
    fetchTables();
    
    // Subscribe to changes in the games table
    const subscription = supabase
      .channel('games-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'games' }, 
        () => {
          fetchTables();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTables]);

  const handleContactAdmin = useCallback(() => {
    alert('Contact administrator at admin@smittypoker.com');
    setHelpMenuOpen(false);
  }, []);

  const handleViewNews = useCallback(() => {
    alert('Site News: Welcome to Smitty Poker Club! We\'re excited to have you here.');
    setHelpMenuOpen(false);
  }, []);

  const handleViewFaq = useCallback(() => {
    alert('FAQ: For common questions and answers, please visit our documentation.');
    setHelpMenuOpen(false);
  }, []);

  const handleTableHighlight = useCallback((id: string) => {
    setHighlightedTableId(id);
  }, []);

  const handleTableSelect = useCallback((table: PokerTable) => {
    if (table.id === '2.7') {
      // Open test table instead of regular table
      setShowTestTable(true);
    } else {
      setSelectedTable(table);
    }
  }, []);

  const tableHandlers = useTableHandlers(
    tables,
    handleTableHighlight,
    handleTableSelect
  );

  const handleApplyFilters = useCallback((filters: any) => {
    setActiveFilters(filters);
    setShowFilter(false);
  }, []);

  const filteredTables = useFilters(tables, activeFilters);

  const renderContent = () => {
    switch (activeView) {
      case 'tournaments':
        return (
          <div className="flex-1 overflow-auto">
            <div className="bg-gray-700 p-2 text-gray-200 font-medium grid grid-cols-6 gap-2">
              <div>Tournament ID</div>
              <div>Game</div>
              <div>Buy In</div>
              <div>TS</div>
              <div>Reg</div>
              <div>Starts / Status ▼</div>
            </div>
            {tournaments.map((tournament) => (
              <div 
                key={tournament.id}
                onClick={() => setSelectedTournament(tournament.id)}
                className={`bg-gray-800 p-2 text-gray-300 grid grid-cols-6 gap-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 ${
                  selectedTournament === tournament.id ? 'bg-gray-600' : ''
                }`}
              >
                <div className="font-medium">{tournament.name}</div>
                <div>{tournament.gameType}</div>
                <div>{tournament.buyIn}</div>
                <div>{tournament.tableSize}</div>
                <div>{tournament.registered}</div>
                <div>{tournament.startTime}</div>
              </div>
            ))}
          </div>
        );
      case 'sitngos':
        return (
          <div className="flex-1 overflow-auto">
            <div className="bg-gray-700 p-2 text-gray-200 font-medium grid grid-cols-6 gap-2">
              <div>Sit & Go ID</div>
              <div>Game</div>
              <div>Buy In</div>
              <div>TS</div>
              <div>Reg ▼</div>
              <div>Starts / Status</div>
            </div>
            {sitAndGoTournaments.map((tournament) => (
              <div 
                key={tournament.id}
                className="bg-gray-800 p-2 text-gray-300 grid grid-cols-6 gap-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700"
              >
                <div className="font-medium">{tournament.name}</div>
                <div>{tournament.gameType}</div>
                <div>{tournament.buyIn}</div>
                <div>{tournament.tableSize}</div>
                <div>{tournament.registered}</div>
                <div className="text-amber-500">{tournament.status}</div>
              </div>
            ))}
          </div>
        );
      case 'ring-games':
        return (
          <>
            {tableError && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 m-4 text-red-200">
                <p className="font-medium">Error loading tables:</p>
                <p>{tableError}</p>
              </div>
            )}
            
            {isLoadingTables ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Loading tables...</span>
              </div>
            ) : (
              <RingGamesTable
                tables={filteredTables}
                highlightedTableId={highlightedTableId}
                tableHandlers={tableHandlers}
              />
            )}
            
            {activeView === 'ring-games' && highlightedTableId && (
              <div className="p-2 bg-blue-900 text-blue-100 text-center">
                {tables.find(t => t.id === highlightedTableId)?.name}
              </div>
            )}
            {activeView === 'ring-games' && (
              <div className="grid grid-cols-5 gap-1 p-1 bg-gray-700">
                <button 
                  onClick={() => setShowFilter(true)}
                  className={`bg-gray-600 hover:bg-gray-500 text-gray-200 p-2 rounded transition ${
                    activeFilters?.filterEnabled ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  Filter {activeFilters?.filterEnabled ? '(On)' : ''}
                </button>
                <button className="bg-gray-600 hover:bg-gray-500 text-gray-200 p-2 rounded transition">
                  Observe Table
                </button>
                <button 
                  onClick={() => highlightedTableId && setShowTableInfo(true)}
                  disabled={!highlightedTableId}
                  className={`bg-gray-600 hover:bg-gray-500 text-gray-200 p-2 rounded transition ${
                    !highlightedTableId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Table Info
                </button>
                <button className="bg-gray-600 hover:bg-gray-500 text-gray-200 p-2 rounded transition">
                  Players
                </button>
                <button className="bg-gray-600 hover:bg-gray-500 text-gray-200 p-2 rounded transition">
                  Join Wait List
                </button>
              </div>
            )}
          </>
        );
      default:
        return (
          <div className="flex h-[400px]">
            <div className="flex-1 border-r border-gray-700">
              <OnlinePlayersList />
            </div>

            <div className="w-1/3 bg-gray-800 flex flex-col">
              <div className="flex-1 p-2">
              </div>
              <div className="p-2 bg-gray-700">
                <p className="text-center text-sm text-gray-400">Extended Lobby Chat</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-6xl mx-auto bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700">
        <WindowHeader />
        <Navigation
          helpMenuOpen={helpMenuOpen}
          onHelpMenuToggle={() => setHelpMenuOpen(!helpMenuOpen)}
          onHelpMenuClose={() => setHelpMenuOpen(false)}
          onContactAdmin={handleContactAdmin}
          onViewNews={handleViewNews}
          onViewFaq={handleViewFaq}
        />

        <div className="bg-gray-700 p-4 text-center">
          <h2 className="text-2xl font-bold text-amber-500">Smitty Poker Club</h2>
        </div>

        <StatsBar
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {renderContent()}

        <BottomButtons />
      </div>

      {selectedTable && (
        <PokerTableModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}

      {showTestTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/75" onClick={() => setShowTestTable(false)} />
          <div className="relative z-10">
            <TestPokerTable
              id="2.7"
              name="Test Table"
              gameType="NL Hold'em"
              stakes="0.25/0.50"
              buyIn="10 - 50"
              maxPlayers={6}
              onClose={() => setShowTestTable(false)}
            />
          </div>
        </div>
      )}

      {showTableInfo && highlightedTableId && (
        <TableInfoPanel
          table={tables.find(t => t.id === highlightedTableId)!}
          onClose={() => setShowTableInfo(false)}
        />
      )}

      {showFilter && (
        <FilterPanel
          onClose={() => setShowFilter(false)}
          onApplyFilters={handleApplyFilters}
        />
      )}
    </div>
  );
}