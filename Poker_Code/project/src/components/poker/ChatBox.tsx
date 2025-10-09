import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatBoxProps {
  className?: string;
  onSendMessage: (message: string) => void;
}

export function ChatBox({ className = '', onSendMessage }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{
    id: string;
    text: string;
    player: string;
    timestamp: Date;
  }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className={`bg-black/60 rounded backdrop-blur-sm flex flex-col ${className}`}>
      <div className="flex-1 p-4 overflow-y-auto max-h-60">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-blue-400 font-medium">{msg.player}</span>
              <span className="text-gray-500 text-xs">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-white">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}