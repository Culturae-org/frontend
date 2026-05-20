import { Box, Typography, Skeleton, useTheme } from "@mui/material";
import { BorderedCard } from "@/components/Common/StyledComponents";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  trend,
}: StatCardProps) {
  const theme = useTheme();

  return (
    <BorderedCard
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {icon && (
          <Box
            sx={{
              color: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      {loading ? (
        <Skeleton variant="text" width={80} height={40} />
      ) : (
        <Typography variant="h4" fontWeight={600} sx={{ mb: 0.5 }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
      )}

      {(subtitle || trend) && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: "auto" }}>
          {trend && (
            <Typography
              variant="caption"
              sx={{
                color: trend.isPositive ? theme.palette.success.main : theme.palette.error.main,
                fontWeight: 500,
              }}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </BorderedCard>
  );
}
