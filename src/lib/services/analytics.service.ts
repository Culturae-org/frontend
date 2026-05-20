import {
  GAMES_ENDPOINTS,
  LEADERBOARD_ENDPOINT,
  LOGS_ENDPOINTS,
  USERS_ENDPOINTS,
} from "@/lib/api/endpoints";
import { BaseService } from "./base.service";
import { usersService } from "./users.service";
import type {
  DashboardAnalytics,
  DailyGameStats,
  DailyUserStats,
  GameModeDistribution,
  AnalyticsGameStats,
  SystemHealth,
  TimeRange,
  TopPlayer,
  UserActivityStats,
  UserDistribution,
  UserStats,
} from "../types/analytics.types";

class AnalyticsService extends BaseService {
  async getDashboardAnalytics(
    timeRange: TimeRange,
  ): Promise<DashboardAnalytics> {
    const [
      gameStats,
      gameModeDistribution,
      dailyGameStats,
      userStats,
      userDistribution,
      topPlayers,
      systemHealth,
      dailyUserStats,
      userActivityStats,
    ] = await Promise.all([
      this.getGameStats(),
      this.getGameModeDistribution(),
      this.getDailyGameStats(timeRange),
      this.getUserStats(),
      this.getUserDistribution(),
      this.getTopPlayers(50),
      this.getSystemHealth(),
      this.getDailyUserStats(timeRange),
      this.getUserActivityStats(timeRange),
    ]);

    return {
      gameStats,
      gameModeDistribution,
      dailyGameStats,
      userStats,
      userDistribution,
      topPlayers,
      systemHealth,
      dailyUserStats,
      userActivityStats,
    };
  }

  private async getGameStats(): Promise<AnalyticsGameStats> {
    interface GameStatsResponse {
      total_games: number;
      active_games: number;
      completed_games: number;
      cancelled_games: number;
      abandoned_games: number;
      total_players: number;
    }

    interface GamePerformanceResponse {
      avg_game_duration_seconds: number;
      avg_questions_per_game: number;
      avg_players_per_game: number;
      most_popular_mode: string;
    }

    const [stats, performance] = await Promise.all([
      this.get<GameStatsResponse>(GAMES_ENDPOINTS.STATS),
      this.get<GamePerformanceResponse>(GAMES_ENDPOINTS.PERFORMANCE_STATS),
    ]);

    return {
      totalGames: stats.total_games,
      activeGames: stats.active_games,
      completedGames: stats.completed_games,
      cancelledGames: stats.cancelled_games,
      abandonedGames: stats.abandoned_games,
      totalPlayers: stats.total_players,
      averageDuration: performance.avg_game_duration_seconds,
      averageQuestionsPerGame: performance.avg_questions_per_game,
      averagePlayersPerGame: performance.avg_players_per_game,
      mostPopularMode: performance.most_popular_mode,
    };
  }

  private async getGameModeDistribution(): Promise<GameModeDistribution[]> {
    interface GameModeStatsResponse {
      solo: number;
      duel: number;
      multi: number;
      [key: string]: number;
    }

    const response = await this.get<GameModeStatsResponse>(
      GAMES_ENDPOINTS.MODE_STATS,
    );

    const modeMapping: Record<string, string> = {
      solo: "Solo",
      duel: "1v1",
      multi: "Multi",
    };

    const total = Object.values(response).reduce(
      (sum, count) => sum + count,
      0,
    );

    return Object.entries(response)
      .filter(([mode]) => modeMapping[mode])
      .map(([mode, count]) => ({
        mode: modeMapping[mode] || mode,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }

  private async getDailyGameStats(
    timeRange: TimeRange,
  ): Promise<DailyGameStats[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.getDaysFromRange(timeRange));

    const params = {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    };

    interface DailyGameStatResponse {
      date: string;
      total_games: number;
      completed_games: number;
      cancelled_games: number;
      total_players: number;
    }

    const response = await this.get<DailyGameStatResponse[]>(
      GAMES_ENDPOINTS.DAILY_STATS,
      params,
    );

    return response.map((stat) => ({
      date: stat.date,
      totalGames: stat.total_games,
      completedGames: stat.completed_games,
      cancelledGames: stat.cancelled_games,
      totalPlayers: stat.total_players,
    }));
  }

  private async getUserStats(): Promise<UserStats> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    const [totalRes, onlineRes, weeklyRes, newThisWeekDates] =
      await Promise.all([
        this.get<number>(USERS_ENDPOINTS.COUNT),
        this.get<number>(USERS_ENDPOINTS.COUNT_ONLINE),
        this.get<number>(USERS_ENDPOINTS.COUNT_ACTIVE_WEEKLY),
        usersService.getCreationDates(weekStartStr, todayStr),
      ]);

    return {
      totalUsers: totalRes,
      onlineUsers: onlineRes,
      weeklyActiveUsers: weeklyRes,
      newUsersThisWeek: newThisWeekDates.length,
    };
  }

  private async getUserDistribution(): Promise<UserDistribution> {
    const [levelStats, roleStats] = await Promise.all([
      this.get<Record<string, number>>(USERS_ENDPOINTS.LEVEL_STATS),
      this.get<Record<string, number>>(USERS_ENDPOINTS.ROLE_STATS),
    ]);

    const toArray = (obj: Record<string, number>) =>
      Object.entries(obj ?? {}).map(([key, count]) => ({ key, count }));

    return {
      byRank: toArray(levelStats).map(({ key, count }) => ({
        rank: key,
        count,
      })),
      byRole: toArray(roleStats).map(({ key, count }) => ({
        role: key.charAt(0).toUpperCase() + key.slice(1),
        count,
      })),
    };
  }

  private async getTopPlayers(limit: number): Promise<TopPlayer[]> {
    interface LeaderboardEntry {
      public_id: string;
      username: string;
      score: number;
      rank: number;
    }

    const response = await this.get<LeaderboardEntry[]>(LEADERBOARD_ENDPOINT, {
      limit: limit.toString(),
    });

    return (response ?? []).map((entry) => ({
      id: entry.public_id,
      username: entry.username,
      score: entry.score,
      gamesPlayed: 0,
      winRate: 0,
    }));
  }

  private async getSystemHealth(): Promise<SystemHealth> {
    interface ServiceStatus {
      services: Array<{
        service_name: string;
        status: string;
        response_time_ms: number;
      }>;
    }

    const response = await this.get<ServiceStatus>(
      LOGS_ENDPOINTS.SERVICE_STATUS,
    );

    const serviceMap: SystemHealth = {
      postgresql: { status: "unknown", responseTime: 0 },
      redis: { status: "unknown", responseTime: 0 },
      minio: { status: "unknown", responseTime: 0 },
    };

    response.services.forEach((service) => {
      const key = (
        service.service_name === "postgres"
          ? "postgresql"
          : service.service_name
      ) as keyof SystemHealth;
      if (serviceMap[key]) {
        serviceMap[key] = {
          status: service.status,
          responseTime: service.response_time_ms,
        };
      }
    });

    return serviceMap;
  }

  private async getDailyUserStats(
    timeRange: TimeRange,
  ): Promise<DailyUserStats[]> {
    const days = this.getDaysFromRange(timeRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const [dates, currentTotal] = await Promise.all([
      usersService.getCreationDates(startDateStr, endDateStr),
      this.get<number>(USERS_ENDPOINTS.COUNT),
    ]);

    const countsByDay = new Map<string, number>();
    for (const d of dates) {
      const day = (d as string).split("T")[0];
      countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
    }

    const totalInRange = Array.from(countsByDay.values()).reduce(
      (a, b) => a + b,
      0,
    );
    let cumulative = currentTotal - totalInRange;

    const result: DailyUserStats[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const day = d.toISOString().split("T")[0];
      const newUsers = countsByDay.get(day) ?? 0;
      cumulative += newUsers;
      result.push({ date: day, newUsers, totalUsers: cumulative });
    }

    return result;
  }

  private async getUserActivityStats(
    timeRange: TimeRange,
  ): Promise<UserActivityStats[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.getDaysFromRange(timeRange));

    const params = {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    };

    interface DailyActiveUserStat {
      date: string;
      active_users: number;
      active_sessions: number;
    }

    const response = await this.get<DailyActiveUserStat[]>(
      USERS_ENDPOINTS.DAILY_ACTIVE,
      params,
    );

    return response.map((stat) => ({
      date: stat.date,
      activeUsers: stat.active_users,
      sessions: stat.active_sessions,
    }));
  }

  private getDaysFromRange(range: TimeRange): number {
    switch (range) {
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "90d":
        return 90;
      case "1y":
        return 365;
      default:
        return 30;
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
