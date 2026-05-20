import { useLayoutEffect, useRef, useState } from "react";
import { Box, ListItemIcon, ListItemText, Menu, MenuItem, Tab, Tabs, useTheme, useMediaQuery, styled, alpha } from "@mui/material";
import MoreVert from "@mui/icons-material/MoreVert";

export interface TabConfig<T> {
  label: string;
  value: T;
  icon?: React.ReactElement;
}

interface ResponsiveTabsProps<T> {
  tabs: TabConfig<T>[];
  value: T;
  onChange: (event: React.SyntheticEvent, value: T) => void;
}

export const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 36,
  overflow: "initial",
  "& .MuiTabs-flexContainer": {
    gap: 24,
  },
  "& .MuiTabs-scroller": {
    overflow: "initial !important",
  },
  "& .MuiTabs-indicator": {
    bottom: "initial",
  },
}));

export const StyledTab = styled(Tab)(({ theme }) => ({
  padding: "8px 0px",
  overflow: "initial",
  minHeight: 36,
  minWidth: 0,
  textTransform: "none",
  fontSize: "0.875rem",
  fontWeight: 500,
  transition: theme.transitions.create(["background-color", "color"]),
  position: "relative",
  "&::after": {
    content: "''",
    borderRadius: 8,
    position: "absolute",
    top: 4,
    bottom: 4,
    left: -8,
    right: -8,
    transition: theme.transitions.create(["background-color"]),
    backgroundColor: "transparent",
  },
  "&.MuiButtonBase-root .MuiTouchRipple-root": {
    borderRadius: 8,
    top: 4,
    bottom: 4,
    left: -8,
    right: -8,
  },
  "&:hover": {
    "&:not(.Mui-selected)": {
      color: "text.primary",
      "&::after": {
        backgroundColor: theme.palette.action.hover,
      },
    },
    "&.Mui-selected::after": {
      backgroundColor: alpha(theme.palette.primary.main, 0.06),
    },
  },
}));

export default function ResponsiveTabs<T>({
  tabs,
  value,
  onChange,
}: ResponsiveTabsProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [hideTabs, setHideTabs] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (event: React.SyntheticEvent, tabValue: T) => {
    onChange(event, tabValue);
    handleMenuClose();
  };

  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (tabsRef.current?.children[0]?.children[0]) {
        setHideTabs(
          (tabsRef.current?.children[0]?.children[0]?.scrollWidth ?? 0) >
            (tabsRef.current?.children[0]?.children[0]?.clientWidth ?? 0)
        );
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [tabs]);

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        pb: "2px",
        mb: 3,
      }}
    >
      <StyledTabs ref={tabsRef} value={value} onChange={onChange}>
        {tabs
          .filter((tab) => (isMobile || hideTabs ? tab.value === value : true))
          .map((tab) => (
            <StyledTab
              key={String(tab.value)}
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
            />
          ))}
        {(isMobile || hideTabs) && tabs.length > 1 && (
          <>
            <StyledTab
              label={<MoreVert sx={{ fontSize: 20 }} />}
              onClick={handleMenuOpen}
              disabled={false}
            />
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {tabs
                .filter((tab) => tab.value !== value)
                .map((option) => (
                  <MenuItem
                    key={String(option.value)}
                    dense
                    onClick={(e) => handleMenuItemClick(e, option.value)}
                  >
                    {option.icon && <ListItemIcon>{option.icon}</ListItemIcon>}
                    <ListItemText>{option.label}</ListItemText>
                  </MenuItem>
                ))}
            </Menu>
          </>
        )}
      </StyledTabs>
    </Box>
  );
}
