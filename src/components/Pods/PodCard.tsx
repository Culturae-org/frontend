import {
  Box,
  Chip,
  Divider,
  Grid2,
  Skeleton,
  Stack,
  Typography,
  styled,
} from "@mui/material";
import {
  CheckmarkCircle20Filled,
  Warning20Filled,
  DismissCircle20Filled,
  Star20Filled,
  Desktop20Regular,
} from "@fluentui/react-icons";
import type { PodInfo } from "@/lib/types/pods.types";

const BorderedCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  transition: "background-color 0.2s ease",
}));

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <Box sx={{ textAlign: "center" }}>
    <Typography variant="h6" fontWeight={700} lineHeight={1}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

interface PodCardProps {
  pod?: PodInfo;
  loading?: boolean;
}

const statusConfig = {
  healthy: {
    icon: <CheckmarkCircle20Filled style={{ color: "var(--color-success)" }} />,
    label: "Healthy",
    color: "success" as const,
  },
  degraded: {
    icon: <Warning20Filled style={{ color: "var(--color-warning)" }} />,
    label: "Degraded",
    color: "warning" as const,
  },
  offline: {
    icon: <DismissCircle20Filled style={{ color: "var(--color-error)" }} />,
    label: "Offline",
    color: "error" as const,
  },
};

export default function PodCard({ pod, loading }: PodCardProps) {
  if (loading || !pod) {
    return (
      <Grid2 size={{ xs: 12, sm: 6, lg: 4 }}>
        <BorderedCard>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Skeleton variant="text" width={160} height={24} />
            <Skeleton variant="rounded" width={60} height={22} />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 1.5,
              mb: 2,
            }}
          >
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={80} />
          </Box>
          <Divider />
          <Box sx={{ display: "flex", justifyContent: "space-around", mt: 2 }}>
            <Skeleton variant="text" width={40} height={40} />
            <Skeleton variant="text" width={40} height={40} />
            <Skeleton variant="text" width={40} height={40} />
          </Box>
          <Skeleton variant="text" width="60%" sx={{ mt: 1.5 }} />
        </BorderedCard>
      </Grid2>
    );
  }

  const status = statusConfig[pod.status];
  const uptime = Math.floor(
    (Date.now() - new Date(pod.started_at).getTime()) / 1000 / 60,
  );
  const uptimeLabel =
    uptime < 60
      ? `${uptime}m uptime`
      : uptime < 1440
        ? `${Math.floor(uptime / 60)}h uptime`
        : `${Math.floor(uptime / 1440)}d uptime`;

  return (
    <Grid2 size={{ xs: 12, sm: 6, lg: 4 }}>
      <BorderedCard
        sx={{
          outline: pod.is_current ? 2 : 0,
          outlineColor: "primary.main",
          outlineOffset: -2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ fontFamily: "monospace" }}
            >
              {pod.pod_id.substring(0, 18)}…
            </Typography>
            {pod.is_current && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.25,
                }}
              >
                <Star20Filled
                  style={{
                    fontSize: 14,
                    color: "var(--mui-palette-primary-main)",
                  }}
                />
                <Typography variant="caption" color="primary">
                  Current pod
                </Typography>
              </Box>
            )}
          </Box>
          <Chip
            label={pod.pod_type}
            size="small"
            variant="outlined"
            color={pod.pod_type === "main" ? "primary" : "secondary"}
            icon={<Desktop20Regular style={{ fontSize: 14 }} />}
          />
        </Box>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ mt: 1.5, mb: 2 }}
        >
          {status.icon}
          <Typography
            variant="body2"
            color={`${status.color}.main`}
            fontWeight={500}
          >
            {status.label}
          </Typography>
        </Stack>

        <Divider />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            mt: 2,
            mb: 1.5,
          }}
        >
          <StatItem label="Clients" value={pod.connected_clients} />
          <StatItem label="Users" value={pod.online_users} />
          <StatItem label="Games" value={pod.active_games} />
        </Box>

        <Typography variant="caption" color="text.secondary">
          {uptimeLabel} · last seen{" "}
          {new Date(pod.last_heartbeat).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </Typography>
      </BorderedCard>
    </Grid2>
  );
}
