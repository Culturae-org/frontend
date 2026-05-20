import { usePods } from "@/lib/hooks/usePods";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import {
  Box,
  Chip,
  Divider,
  Grid2,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Skeleton,
  styled,
  Typography,
  useTheme,
} from "@mui/material";
import { ArrowSync20Regular } from "@fluentui/react-icons";
import type { PodInfo } from "@/lib/types/pods.types";
import { SecondaryButton } from "@/components/Common/StyledComponents";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  boxShadow: "none",
  border: `1px solid ${theme.palette.divider}`,
}));

function StatCard({ label, value, loading }: { label: string; value: number | undefined; loading: boolean }) {
  return (
    <StyledPaper sx={{ p: 2.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem", fontWeight: 500 }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={52} sx={{ fontSize: "1.75rem", mt: 0.25 }} />
      ) : (
        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.25, lineHeight: 1.1 }}>
          {value ?? 0}
        </Typography>
      )}
    </StyledPaper>
  );
}

const statusConfig = {
  healthy: { label: "Healthy" },
  degraded: { label: "Degraded" },
  offline: { label: "Offline" },
};

function PodListItem({ pod }: { pod: PodInfo }) {
  const status = statusConfig[pod.status];
  return (
    <>
      <ListItem
        sx={{ py: 1.5, px: 0 }}
        secondaryAction={
          <Box sx={{ display: "flex", gap: 3, alignItems: "center", pr: 1 }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" fontWeight={600}>{pod.connected_clients}</Typography>
              <Typography variant="caption" color="text.secondary">Clients</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" fontWeight={600}>{pod.online_users}</Typography>
              <Typography variant="caption" color="text.secondary">Users</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" fontWeight={600}>{pod.active_games}</Typography>
              <Typography variant="caption" color="text.secondary">Games</Typography>
            </Box>
          </Box>
        }
      >
        <ListItemAvatar sx={{ minWidth: 36 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: pod.status === "healthy" ? "success.main" : "error.main",
              mt: 0.5,
            }}
          />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "monospace" }}>
                {pod.pod_id.substring(0, 8)}
              </Typography>
              <Chip label={pod.pod_type} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.7rem" }} />
              {pod.is_current && (
                <Chip label="current" size="small" color="primary" sx={{ height: 18, fontSize: "0.7rem" }} />
              )}
            </Box>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {status.label} · last seen {new Date(pod.last_heartbeat).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </Typography>
          }
        />
      </ListItem>
      <Divider />
    </>
  );
}

function PodListItemSkeleton() {
  return (
    <>
      <ListItem sx={{ py: 1.5, px: 0 }}>
        <ListItemAvatar>
          <Skeleton variant="circular" width={36} height={36} />
        </ListItemAvatar>
        <ListItemText
          primary={<Skeleton variant="text" width={200} />}
          secondary={<Skeleton variant="text" width={150} />}
        />
      </ListItem>
      <Divider />
    </>
  );
}

export default function PodsPage() {
  const theme = useTheme();
  const { data, loading, refetch } = usePods(5000);

  const pods = data?.pods ?? [];
  const meta = data?.meta;
  const isInitialLoad = loading && pods.length === 0;

  const chartData = pods.map((p) => ({
    name: p.pod_id.substring(0, 8),
    Clients: p.connected_clients,
    Users: p.online_users,
    Games: p.active_games,
  }));

  const chartHeight = Math.max(180, pods.length * 52 + 60);

  return (
    <PageContainer>
      <PageHeader title="Pods" subtitle="Real-time view of running pods">
        <SecondaryButton variant="contained" onClick={refetch} disabled={loading} startIcon={<ArrowSync20Regular />}>
          Refresh
        </SecondaryButton>
      </PageHeader>

      <Grid2 container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Pods", value: meta?.total_pods },
          { label: "Connected Clients", value: meta?.total_clients },
          { label: "Online Users", value: meta?.total_users },
          { label: "Active Games", value: data?.pods.reduce((acc, p) => acc + p.active_games, 0) },
        ].map(({ label, value }) => (
          <Grid2 key={label} size={{ xs: 6, sm: 3 }}>
            <StatCard label={label} value={value} loading={isInitialLoad} />
          </Grid2>
        ))}
      </Grid2>

      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12, lg: 8 }}>
          <StyledPaper>
            <Typography variant="subtitle1" fontWeight={500} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Running pods
              {meta && (
                <Typography variant="body2" color="text.secondary">
                  {meta.total_pods} pod{meta.total_pods !== 1 ? "s" : ""}
                </Typography>
              )}
            </Typography>
            <Divider sx={{ mt: 1, mb: 0 }} />
            <List disablePadding>
              {isInitialLoad
                ? Array.from({ length: 3 }).map((_, i) => <PodListItemSkeleton key={i} />)
                : pods.length > 0
                ? pods.map((pod) => <PodListItem key={pod.pod_id} pod={pod} />)
                : (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography color="text.secondary" variant="body2">No pods found</Typography>
                  </Box>
                )}
            </List>
          </StyledPaper>
        </Grid2>

        <Grid2 size={{ xs: 12, lg: 4 }}>
          <StyledPaper>
            <Typography variant="subtitle1" fontWeight={500}>Load distribution</Typography>
            <Divider sx={{ mt: 1, mb: 2 }} />
            {isInitialLoad ? (
              <Skeleton variant="rectangular" height={chartHeight} sx={{ borderRadius: 1 }} />
            ) : pods.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fontFamily: "monospace", fill: theme.palette.text.secondary }}
                    width={68}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      fontSize: 12,
                      borderColor: theme.palette.divider,
                      boxShadow: "none",
                      borderRadius: 6,
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    }}
                    cursor={{ fill: theme.palette.action.hover }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 12, color: theme.palette.text.secondary }}
                    iconType="circle"
                    iconSize={7}
                  />
                  <Bar dataKey="Clients" fill={theme.palette.primary.main} radius={[0, 3, 3, 0]} barSize={9} />
                  <Bar dataKey="Users" fill={theme.palette.text.disabled} radius={[0, 3, 3, 0]} barSize={9} />
                  <Bar dataKey="Games" fill={theme.palette.warning.main} radius={[0, 3, 3, 0]} barSize={9} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {!isInitialLoad && meta && (
              <>
                <Divider sx={{ mt: 2, mb: 1.5 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {[
                    { label: "Main pods", value: meta.main_pods },
                    { label: "Headless pods", value: meta.headless_pods },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </StyledPaper>
        </Grid2>
      </Grid2>
    </PageContainer>
  );
}
