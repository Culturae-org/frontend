import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import type { ContainerProps } from "@mui/material";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: ContainerProps["maxWidth"];
  plain?: boolean;
}

export default function PageContainer({
  children,
  maxWidth = "xl",
  plain = false,
}: PageContainerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (plain) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          py: 3,
          overflow: "auto",
        }}
      >
        <Container maxWidth={maxWidth}>{children}</Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: 0,
        py: isMobile ? 2 : 4,
        px: isMobile ? 2 : 0,
        overflow: "auto",
        backgroundColor: "background.paper",
        borderRadius: isMobile ? 0 : `${theme.shape.borderRadius}px`,
        border: isMobile ? "none" : `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth={maxWidth}>{children}</Container>
    </Box>
  );
}
