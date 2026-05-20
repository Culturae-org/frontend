import { Box, Typography, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { NoWrapTypography } from "./StyledComponents";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  noWrap?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  children,
  noWrap = false,
}: PageHeaderProps) {
  const TitleComponent = noWrap ? NoWrapTypography : Typography;

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <TitleComponent variant="h5" fontWeight={600}>
          {title}
        </TitleComponent>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {children && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {children}
        </Stack>
      )}
    </Box>
  );
}
