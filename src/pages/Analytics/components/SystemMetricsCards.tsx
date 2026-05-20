import { Grid2 } from "@mui/material";
import {
  People20Regular,
  Live20Regular,
  Globe20Regular,
  Timer20Regular,
} from "@fluentui/react-icons";
import { StatCard } from "./StatCard";
import type { SystemMetrics } from "@/lib/types/stats.types";

interface SystemMetricsCardsProps {
  metrics: SystemMetrics | null;
  loading: boolean;
  labels: {
    totalUsers: string;
    activeSessions: string;
    totalApiRequests: string;
    avgResponseTime: string;
  };
}

export function SystemMetricsCards({ metrics, loading, labels }: SystemMetricsCardsProps) {
  return (
    <Grid2 container spacing={2}>
      <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title={labels.totalUsers} value={metrics?.total_users ?? 0} icon={<People20Regular fontSize={24} />} loading={loading} />
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title={labels.activeSessions} value={metrics?.active_sessions ?? 0} icon={<Live20Regular fontSize={24} />} loading={loading} />
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title={labels.totalApiRequests} value={metrics?.total_api_requests ?? 0} icon={<Globe20Regular fontSize={24} />} loading={loading} />
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title={labels.avgResponseTime}
          value={metrics?.avg_response_time_ms != null ? `${metrics.avg_response_time_ms.toFixed(1)} ms` : "—"}
          icon={<Timer20Regular fontSize={24} />}
          loading={loading}
        />
      </Grid2>
    </Grid2>
  );
}
