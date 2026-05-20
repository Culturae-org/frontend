import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { GAMES_ENDPOINTS } from "@/lib/api/endpoints";
import { usersService } from "@/lib/services/users.service";
import type { DailyGameStats, DailyUserStats, TimeRange } from "@/lib/types/analytics.types";

interface DashboardChartData {
  dailyGameStats: DailyGameStats[];
  dailyUserStats: DailyUserStats[];
}

function getDays(range: TimeRange): number {
  switch (range) {
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
    case "1y": return 365;
    default: return 30;
  }
}

export function useDashboardChartData(timeRange: TimeRange) {
  const [data, setData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = getDays(timeRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      const [gamesRes, dates, currentTotal] = await Promise.all([
        apiGet(`${GAMES_ENDPOINTS.DAILY_STATS}?start_date=${startStr}&end_date=${endStr}`),
        usersService.getCreationDates(startStr, endStr).catch(() => [] as string[]),
        usersService.getUserCount().catch(() => 0),
      ]);

      // Daily game stats
      let dailyGameStats: DailyGameStats[] = [];
      if (gamesRes.ok) {
        const json = await gamesRes.json();
        const raw: Array<{
          date: string;
          total_games: number;
          completed_games: number;
          cancelled_games: number;
          total_players: number;
        }> = json.data ?? json;
        if (Array.isArray(raw)) {
          dailyGameStats = raw.map((s) => ({
            date: s.date,
            totalGames: s.total_games,
            completedGames: s.completed_games,
            cancelledGames: s.cancelled_games,
            totalPlayers: s.total_players,
          }));
        }
      }

      // Daily user stats — rebuild from creation dates
      const countsByDay = new Map<string, number>();
      for (const d of dates) {
        const day = d.split("T")[0];
        countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
      }
      const totalInRange = Array.from(countsByDay.values()).reduce((a, b) => a + b, 0);
      let cumulative = currentTotal - totalInRange;
      const dailyUserStats: DailyUserStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - i);
        const day = d.toISOString().split("T")[0];
        const newUsers = countsByDay.get(day) ?? 0;
        cumulative += newUsers;
        dailyUserStats.push({ date: day, newUsers, totalUsers: cumulative });
      }

      setData({ dailyGameStats, dailyUserStats });
    } catch {
      // silent fail — chart just stays empty
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading };
}
