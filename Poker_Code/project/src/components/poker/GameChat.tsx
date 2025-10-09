import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/auth';

interface GameChatProps {
  onSendMessage: (message: string) => void;
  className?: string;
}

export function GameChat({ onSendMessage, className = '' }: GameChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{
    id: string;
    playerId: string;
    playerName: string;
    message: string;
    timestamp: Date;
  }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const newMessage = {
      id: crypto.randomUUID(),
      playerId: user.id,
      playerName: user.email?.split('@')[0] || 'Guest',
      message: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    onSendMessage(message.trim());
    setMessage('');
  };

  return (
    <div className={`bg-gray-900 flex flex-col ${className}`}>
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-blue-400">
                  {msg.playerName}
                </span>
                <span className="text-xs text-gray-500">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white">{msg.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}