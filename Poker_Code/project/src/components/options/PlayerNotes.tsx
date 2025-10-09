import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface PlayerNotesProps {
  onClose: () => void;
}

interface PlayerNote {
  id: string;
  playerId: string;
  playerName: string;
  note: string;
  color: string;
  timestamp: string;
}

export function PlayerNotes({ onClose }: PlayerNotesProps) {
  const [notes, setNotes] = useLocalStorage<PlayerNote[]>('playerNotes', []);
  const [selectedNote, setSelectedNote] = useState<PlayerNote | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveNote = () => {
    if (selectedNote && editingNote.trim()) {
      const updatedNotes = notes.map(note =>
        note.id === selectedNote.id
          ? { ...note, note: editingNote.trim(), timestamp: new Date().toISOString() }
          : note
      );
      setNotes(updatedNotes);
      setIsEditing(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const colorOptions = [
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Green', value: 'bg-green-500' },
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Purple', value: 'bg-purple-500' },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[800px] h-[600px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Player Notes</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 h-[calc(100%-60px)]">
          {/* Player List */}
          <div className="border-r border-gray-700">
            <div className="p-2 bg-gray-700 text-white font-medium grid grid-cols-3">
              <div>Player</div>
              <div>Color</div>
              <div>Actions</div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-40px)]">
              {notes.map(note => (
                <div
                  key={note.id}
                  className={`p-2 grid grid-cols-3 items-center border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${
                    selectedNote?.id === note.id ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => {
                    setSelectedNote(note);
                    setEditingNote(note.note);
                    setIsEditing(false);
                  }}
                >
                  <div className="text-gray-300">{note.playerName}</div>
                  <div className={`w-6 h-6 rounded ${note.color}`} />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNote(note);
                        setEditingNote(note.note);
                        setIsEditing(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note Editor */}
          <div className="p-4 flex flex-col">
            {selectedNote ? (
              <>
                <div className="mb-4">
                  <h3 className="text-white font-medium mb-2">Note for {selectedNote.playerName}</h3>
                  <div className="text-gray-400 text-sm">
                    Last updated: {new Date(selectedNote.timestamp).toLocaleString()}
                  </div>
                </div>
                {isEditing ? (
                  <>
                    <textarea
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      className="flex-1 bg-gray-700 text-gray-200 p-3 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={1000}
                      placeholder="Enter your note here..."
                    />
                    <div className="mt-2 text-gray-400 text-sm">
                      {editingNote.length}/1000 characters
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 bg-gray-700 text-gray-200 p-3 rounded whitespace-pre-wrap">
                      {selectedNote.note}
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
                    >
                      Edit Note
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Select a player to view or edit their note
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}