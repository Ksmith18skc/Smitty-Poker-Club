import React from 'react';
import { useOnlinePlayers } from '../hooks/useOnlinePlayers';
import { LoginTimestamp } from './LoginTimestamp';

export function OnlinePlayersList() {
  const onlinePlayers = useOnlinePlayers();

  return (
    <>
      <div className="bg-gray-700 p-2 text-gray-200 font-medium grid grid-cols-4 gap-2">
        <div>Player</div>
        <div>Color</div>
        <div>Note</div>
        <div>Login Time</div>
      </div>
      {onlinePlayers.map((player) => (
        <div key={player.id} className="bg-gray-800 p-2 text-gray-300 grid grid-cols-4 gap-2">
          <div>{player.email}</div>
          <div></div>
          <div></div>
          <div><LoginTimestamp loginTime={player.loginTime} /></div>
        </div>
      ))}
      {onlinePlayers.length === 0 && (
        <div className="bg-gray-800 p-4 text-gray-400 text-center">
          No players currently online
        </div>
      )}
    </>
  );
}