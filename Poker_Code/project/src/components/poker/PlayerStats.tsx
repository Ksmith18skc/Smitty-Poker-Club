import React from 'react';
import { useAuth } from '../../lib/auth';
import { Trophy, Award, TrendingUp } from 'lucide-react';

export function PlayerStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    handsPlayed: number;
    handsWon: number;
    winRate: number;
    biggestPot: number;
  }>({
    handsPlayed: 0,
    handsWon: 0,
    winRate: 0,
    biggestPot: 0
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const response = await PlayerService.getWinRate(user.id);
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 text-yellow-500">
        <Trophy size={18} />
        <span className="text-white">{stats.handsWon}</span>
      </div>

      <div className="flex items-center gap-2 text-blue-500">
        <Award size={18} />
        <span className="text-white">{stats.handsPlayed}</span>
      </div>

      <div className="flex items-center gap-2 text-green-500">
        <TrendingUp size={18} />
        <span className="text-white">{stats.winRate.toFixed(1)}%</span>
      </div>
    </div>
  );
}