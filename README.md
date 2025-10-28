# 🃏 Smitty-Poker-Club
https://poker.korymsmith.dev/

Smitty Poker Club is a modern, web-based multiplayer poker club I built as a personal project so my friends and I could play poker together from anywhere. It offers real-time gameplay, custom game logic, and a clean UI.


# ✨ Features

♠️ Real-time multiplayer poker (Multiple variants)

🧠 Custom game logic engine

🔐 Player state and action sync via websockets

💡 Clean and responsive UI/UX


# 🚀 Tech Stack

(Tech - Role)

React	- Frontend UI

Tailwind CSS - Styling

Socket.IO	Real - time communication

bolt.new -	Visual prototyping & backend

Node.js - Backend logic

PostgreSQL - Game state persistence

Supabase - Database Managment


# 🧩 How It Works

The game engine follows standard Texas Hold'em rules:

Dealer logic determines small/big blind positions

Players receive 2 hole cards

Community cards are dealt across Flop, Turn, River

Betting rounds between phases

Showdown determines the winner

All actions (fold, check, call, raise) are synced in real-time between connected players.
