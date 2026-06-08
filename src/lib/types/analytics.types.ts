export type TimeRange = "12h" | "1d" | "7d" | "30d" | "90d" | "1y" | "all";
export type ApiTimeRange = "1h" | "6h" | "12h" | "1d" | "7d" | "30d";

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsGameStats {
  totalGames: number;
  activeGames: number;
  completedGames: number;
  cancelledGames: number;
  abandonedGames: number;
  totalPlayers: number;
  averageDuration: number;
  averageQuestionsPerGame: number;
  averagePlayersPerGame: number;
  mostPopularMode: string;
}

export interface GameModeDistribution {
  mode: string;
  count: number;
  percentage: number;
}

export interface DailyGameStats {
  date: string;
  totalGames: number;
  completedGames: number;
  cancelledGames: number;
  totalPlayers: number;
}

export interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  weeklyActiveUsers: number;
  newUsersThisWeek: number;
}

export interface UserDistribution {
  byRank: { rank: string; count: number }[];
  byRole: { role: string; count: number }[];
}

export interface TopPlayer {
  id: string;
  username: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
}

export interface SystemHealth {
  postgresql: { status: string; responseTime: number };
  redis: { status: string; responseTime: number };
  minio: { status: string; responseTime: number };
}

export interface DailyUserStats {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export interface UserActivityStats {
  date: string;
  activeUsers: number;
  sessions: number;
}

export interface DashboardAnalytics {
  gameStats: AnalyticsGameStats;
  gameModeDistribution: GameModeDistribution[];
  dailyGameStats: DailyGameStats[];
  userStats: UserStats;
  userDistribution: UserDistribution;
  topPlayers: TopPlayer[];
  systemHealth: SystemHealth;
  dailyUserStats: DailyUserStats[];
  userActivityStats: UserActivityStats[];
}
