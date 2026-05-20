import { Box, ButtonBase, darken, lighten, styled, Typography } from "@mui/material";
import * as React from "react";
import type { ReactNode } from "react";

const StyledButtonBase = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(
  ({ theme, active }) => ({
    borderRadius: "90px",
    display: "flex",
    justifyContent: "left",
    alignItems: "center",
    width: "100%",
    padding: "4px",
    paddingLeft: "28px",
    height: "32px",
    backgroundColor: active
      ? `${
          theme.palette.mode === "light"
            ? lighten(theme.palette.primary.main, 0.7)
            : darken(theme.palette.primary.main, 0.7)
        }!important`
      : "initial",
    transition:
      "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  }),
);

interface SideNavItemProps {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const SideNavItem = React.forwardRef<HTMLButtonElement, SideNavItemProps>(
  ({ icon, label, active, onClick }, ref) => {
    return (
      <StyledButtonBase active={active} onClick={onClick} ref={ref}>
        <Box sx={{ width: 20, mr: "14px", color: "action.active" }}>
          {icon}
        </Box>
        <Typography variant="body2" noWrap>
          {label}
        </Typography>
      </StyledButtonBase>
    );
  },
);

SideNavItem.displayName = "SideNavItem";

export default SideNavItem;
