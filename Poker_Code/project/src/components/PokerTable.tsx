import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, ChevronLeft, Maximize, Minimize2, Square, X } from 'lucide-react';
import { BuyInDialog } from './BuyInDialog';
import { useAuth } from '../lib/auth';
import { useTablePlayers } from '../hooks/useTablePlayers';
import { supabase } from '../lib/supabase';
import { PlayerService } from '../services/playerService';
import { toast } from 'react-hot-toast';

interface PokerTableProps {
  id: string;
  name: string;
  gameType: string;
  stakes: string;
  buyIn: string;
  maxPlayers: number;
  currentHand: string;
  onClose: () => void;
}

export function PokerTable({
  id,
  name,
  gameType,
  stakes,
  buyIn,
  maxPlayers,
  currentHand,
  onClose
}: PokerTableProps) {
  const { players, isLoading } = useTablePlayers(id);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [showBuyInDialog, setShowBuyInDialog] = useState(false);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0.25);
  const [waitingMessage, setWaitingMessage] = useState('Waiting for 2 ready players');
  const { user } = useAuth();

  const getTableBackground = (tableId: string) => {
    const backgrounds: Record<string, string> = {
      '2.12': "url('https://dxyxrbqsvdksfhzkiezt.supabase.co/storage/v1/object/public/poker-table-backgrounds/Sheiks%20Tent.jpg')",
      '2.2': "url('https://dxyxrbqsvdksfhzkiezt.supabase.co/storage/v1/object/public/poker-table-backgrounds/Frat%20House.jpeg')",
      '2.3': "url('https://dxyxrbqsvdksfhzkiezt.supabase.co/storage/v1/object/public/poker-table-backgrounds/Gentlemens%20Table.jpg')",
      '2.4': "url('https://dxyxrbqsvdksfhzkiezt.supabase.co/storage/v1/object/public/poker-table-backgrounds/Wild%20West%20Saloon.jpg')",
      '2.5': "url('https://dxyxrbqsvdksfhzkiezt.supabase.co/storage/v1/object/public/poker-table-backgrounds/Space%20Station.jpg')",
      '2.6': "url('https://dxyxrbqsvdksfhzkiezt.supabase.co/storage/v1/object/public/poker-table-backgrounds/Augusta.jpg')",
      '2.7': "url('https://images.unsplash.com/photo-1601370690183-1c7965607cf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')",
    };

    return backgrounds[tableId] || "url('https://images.unsplash.com/photo-1509316785289-025f5b846b35?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1476&q=80')";
  };

  const handleSeatClick = (position: number) => {
    if (!user) return;
    if (players.some(p => p.position === position)) return;
    if (players.some(p => p.id === user.id)) return;
    
    setSelectedSeat(position);
    setShowBuyInDialog(true);
  };

  const handleBuyIn = async (amount: number) => {
    if (selectedSeat === null || !user) return;

    try {
      // First update user's balance
      const response = await PlayerService.updateChips(user.id, -amount);
      if (response.error) throw response.error;

      // Then join the table with specific seat
      const channel = supabase.channel(`table:${id}`, {
        config: {
          presence: {
            key: id,
          },
        },
      });

      await channel.subscribe();

      // Track presence with specific seat position
      await channel.track({
        user_id: user.id,
        username: user.email?.split('@')[0],
        position: selectedSeat,
        stack: amount,
        status: 'active',
        last_action: Date.now()
      });

      setShowBuyInDialog(false);
      setSelectedSeat(null);
      toast.success('Successfully joined table');
    } catch (error) {
      console.error('Error joining table:', error);
      toast.error('Failed to join table');
    }
  };

  const renderSeatContent = (position: number) => {
    const player = players.find(p => p.position === position);
    
    if (player) {
      return (
        <div className="bg-black/80 p-3 rounded-lg border border-gray-600 backdrop-blur-sm">
          <div className="text-white font-medium">{player.name}</div>
          <div className="text-green-400 font-bold">${player.stack.toFixed(2)}</div>
          {player.status === 'sitting_out' && (
            <div className="text-red-400 text-sm mt-1">Sitting Out</div>
          )}
          {player.status === 'away' && (
            <div className="text-red-400 text-sm mt-1">Away</div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-black/40 px-4 py-2 rounded-lg border border-gray-600/50 backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer">
        <div className="text-gray-300 text-sm">Click to join</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-[1024px] h-[768px] bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-[1024px] h-[768px] bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
      {/* Table Header */}
      <div className="bg-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="text-gray-300 hover:text-white p-1"><ChevronLeft size={18} /></button>
          <button className="text-gray-300 hover:text-white p-1"><RefreshCw size={18} /></button>
          <span className="text-white">{name} - {gameType} ({buyIn}) - Logged in as {user?.email?.split('@')[0]}</span>
          <span className="text-gray-300">Hand #{currentHand}</span>
        </div>
        <div className="flex gap-2">
          <button className="text-gray-300 hover:text-white p-1"><Settings size={18} /></button>
          <button className="text-gray-300 hover:text-white p-1"><Minimize2 size={18} /></button>
          <button className="text-gray-300 hover:text-white p-1"><Square size={18} /></button>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-1"><X size={18} /></button>
        </div>
      </div>

      {/* Game Info Bar */}
      <div className="bg-gray-600 px-3 py-1 flex items-center justify-between">
        <div className="text-white">{gameType}</div>
        <div className="text-white">
          <span className="mr-4">{stakes}</span>
          <span>{buyIn}</span>
        </div>
      </div>

      {/* Table Area */}
      <div 
        className="relative h-[600px] bg-cover bg-center"
        style={{ 
          backgroundImage: getTableBackground(id),
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        {/* Poker Table Overlay - Completely removed for non-test tables */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[700px] h-[400px]">
            {/* Dealer button */}
            <div className="absolute top-1/2 left-[10%] transform -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md">
              <span className="text-black font-bold">D</span>
            </div>
            
            {/* Center pot area */}
            {pot > 0 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-white font-bold">Pot: ${pot.toFixed(2)}</span>
              </div>
            )}
            
            {/* Current bet indicator */}
            {currentBet > 0 && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="text-white text-sm">Current bet: ${currentBet.toFixed(2)}</span>
              </div>
            )}

            {/* Waiting Message */}
            {players.length < 2 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-semibold bg-black/40 px-6 py-3 rounded-lg backdrop-blur-sm z-10">
                {waitingMessage}
              </div>
            )}

            {/* Player Positions */}
            <div onClick={() => handleSeatClick(0)} className="absolute top-0 left-1/2 -translate-x-1/2 cursor-pointer z-10">
              {renderSeatContent(0)}
            </div>
            
            <div onClick={() => handleSeatClick(1)} className="absolute top-1/4 right-0 cursor-pointer z-10">
              {renderSeatContent(1)}
            </div>
            
            <div onClick={() => handleSeatClick(2)} className="absolute top-1/2 right-0 -translate-y-1/2 cursor-pointer z-10">
              {renderSeatContent(2)}
            </div>
            
            <div onClick={() => handleSeatClick(3)} className="absolute bottom-1/4 right-0 cursor-pointer z-10">
              {renderSeatContent(3)}
            </div>
            
            <div onClick={() => handleSeatClick(4)} className="absolute bottom-0 left-1/2 -translate-x-1/2 cursor-pointer z-10">
              {renderSeatContent(4)}
            </div>
            
            <div onClick={() => handleSeatClick(5)} className="absolute bottom-1/4 left-0 cursor-pointer z-10">
              {renderSeatContent(5)}
            </div>
            
            <div onClick={() => handleSeatClick(6)} className="absolute top-1/2 left-0 -translate-y-1/2 cursor-pointer z-10">
              {renderSeatContent(6)}
            </div>
            
            <div onClick={() => handleSeatClick(7)} className="absolute top-1/4 left-0 cursor-pointer z-10">
              {renderSeatContent(7)}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="h-[120px] bg-gray-900 p-2">
        <div className="h-full bg-gray-800 rounded border border-gray-700 p-2">
          <div className="text-gray-400 text-sm">Click an empty seat to join this table</div>
        </div>
      </div>

      {/* Buy-in Dialog */}
      {showBuyInDialog && (
        <BuyInDialog
          tableName={name}
          minBuyIn={parseFloat(buyIn.split(' - ')[0])}
          maxBuyIn={parseFloat(buyIn.split(' - ')[1])}
          onConfirm={handleBuyIn}
          onClose={() => {
            setShowBuyInDialog(false);
            setSelectedSeat(null);
          }}
        />
      )}
    </div>
  );
}