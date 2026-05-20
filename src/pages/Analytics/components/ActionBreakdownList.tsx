import { Box, Divider, Skeleton, Typography } from "@mui/material";

interface ActionBreakdownListProps {
  data: Record<string, number> | null;
  loading: boolean;
  emptyLabel: string;
}

export function ActionBreakdownList({ data, loading, emptyLabel }: ActionBreakdownListProps) {
  if (loading) {
    return (
      <Box>
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
            <Skeleton variant="text" width={120} />
            <Skeleton variant="text" width={40} />
          </Box>
        ))}
      </Box>
    );
  }

  const entries = Object.entries(data ?? {}).sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Box>
      {entries.map(([key, count], i) => (
        <Box key={key}>
          {i > 0 && <Divider />}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75 }}>
            <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
              {key.replace(/_/g, " ")}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {count.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
