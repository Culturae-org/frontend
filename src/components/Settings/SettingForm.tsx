import Grid2 from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface SettingFormProps {
  title?: ReactNode;
  children: ReactNode;
  lgWidth?: number;
  secondary?: ReactNode;
  spacing?: number;
  noContainer?: boolean;
}

export default function SettingForm({
  title,
  children,
  lgWidth = 8,
  secondary,
  spacing,
  noContainer,
}: SettingFormProps) {
  const inner = (
    <>
      <Grid2
        size={{
          md: lgWidth,
          xs: 12,
        }}
      >
        {title && (
          <Typography
            fontWeight={600}
            sx={{ mb: 0.5 }}
            variant="body2"
          >
            {title}
          </Typography>
        )}
        {children}
      </Grid2>
      {secondary && secondary}
    </>
  );

  if (noContainer) return inner;

  return (
    <Grid2 container spacing={spacing ?? 0}>
      {inner}
    </Grid2>
  );
}
