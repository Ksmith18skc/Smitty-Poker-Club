import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Player } from '../types/database';

export interface OnlinePlayer {
  id: string;
  email: string;
  loginTime: Date;
}

export function useOnlinePlayers() {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);

  useEffect(() => {
    const channel = supabase.channel('online-users');

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      return {
        user_id: user.id,
        email: user.email,
        login_time: new Date().toISOString()
      };
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const players = Object.values(presenceState).flat().map((presence: any) => ({
          id: presence.user_id,
          email: presence.email,
          loginTime: new Date(presence.login_time)
        }));
        setOnlinePlayers(players);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceData = await setupPresence();
          if (presenceData) {
            await channel.track(presenceData);
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return onlinePlayers;
}