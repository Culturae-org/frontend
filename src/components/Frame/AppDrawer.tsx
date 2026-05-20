import {
  Box,
  Drawer,
  Fade,
  IconButton,
  Stack,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft20Regular,
  ChartMultiple20Regular,
  ChartMultiple20Filled,
  ClipboardTextLtr20Regular,
  ClipboardTextLtr20Filled,
  Code20Regular,
  Code20Filled,
  Database20Regular,
  Database20Filled,
  DocumentBulletList20Regular,
  DocumentBulletList20Filled,
  Flag20Regular,
  Flag20Filled,
  Globe20Regular,
  Globe20Filled,
  DataHistogram20Regular,
  DataHistogram20Filled,
  People20Regular,
  People20Filled,
  Server20Regular,
  Server20Filled,
  Settings20Regular,
  Settings20Filled,
  Trophy20Regular,
  Trophy20Filled,
  QuestionCircle20Regular,
  QuestionCircle20Filled,
} from "@fluentui/react-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import SideNavItem from "./SideNavItem";

interface NavItem {
  labelKey: string;
  icon: React.ReactNode;
  iconActive: React.ReactNode;
  path: string;
}

const NAV_DASHBOARD: NavItem = {
  labelKey: "nav.dashboard",
  icon: <DataHistogram20Regular />,
  iconActive: <DataHistogram20Filled />,
  path: "/",
};

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.users", icon: <People20Regular />, iconActive: <People20Filled />, path: "/users" },
  { labelKey: "nav.games", icon: <Trophy20Regular />, iconActive: <Trophy20Filled />, path: "/games" },
  { labelKey: "nav.analytics", icon: <ChartMultiple20Regular />, iconActive: <ChartMultiple20Filled />, path: "/analytics" },
  { labelKey: "nav.reports", icon: <Flag20Regular />, iconActive: <Flag20Filled />, path: "/reports" },
  { labelKey: "nav.datasets", icon: <Database20Regular />, iconActive: <Database20Filled />, path: "/datasets" },
  { labelKey: "nav.questions", icon: <QuestionCircle20Regular />, iconActive: <QuestionCircle20Filled />, path: "/questions" },
  { labelKey: "nav.geography", icon: <Globe20Regular />, iconActive: <Globe20Filled />, path: "/geography" },
  { labelKey: "nav.templates", icon: <DocumentBulletList20Regular />, iconActive: <DocumentBulletList20Filled />, path: "/templates" },
  { labelKey: "nav.pods", icon: <Server20Regular />, iconActive: <Server20Filled />, path: "/pods" },
  { labelKey: "nav.logs", icon: <ClipboardTextLtr20Regular />, iconActive: <ClipboardTextLtr20Filled />, path: "/logs" },
  { labelKey: "nav.settings", icon: <Settings20Regular />, iconActive: <Settings20Filled />, path: "/settings" },
  { labelKey: "nav.apiExplorer", icon: <Code20Regular />, iconActive: <Code20Filled />, path: "/api-explorer" },
];

const DrawerHeaderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

function DrawerHeader({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showCollapse, setShowCollapse] = useState(false);

  return (
    <DrawerHeaderContainer
      onMouseEnter={() => setShowCollapse(true)}
      onMouseLeave={() => setShowCollapse(false)}
    >
      <Box sx={{ width: "100%", pl: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <img src={`${import.meta.env.BASE_URL}culturae.png`} alt="Culturae" style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} />
          <Typography variant="h6" fontWeight={700} noWrap>
            Culturae
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.2 }}>
            Admin
          </Typography>
        </Box>
      </Box>

      {!isMobile && (
        <Box>
          <Fade in={showCollapse}>
            <IconButton onClick={onClose} size="small">
              <ChevronLeft20Regular />
            </IconButton>
          </Fade>
        </Box>
      )}
    </DrawerHeaderContainer>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = useMemo(
    () => (path: string) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname === path || location.pathname.startsWith(path + "/");
    },
    [location.pathname],
  );

  return (
    <>
      <DrawerHeader onClose={onClose} />

      <Stack spacing={2} sx={{ px: 1, pb: 1, flexGrow: 1, mx: 1, overflow: "auto" }}>
        <SideNavItem
          icon={isActive(NAV_DASHBOARD.path) ? NAV_DASHBOARD.iconActive : NAV_DASHBOARD.icon}
          label={t(NAV_DASHBOARD.labelKey)}
          active={isActive(NAV_DASHBOARD.path)}
          onClick={() => navigate(NAV_DASHBOARD.path)}
        />
        <Box>
          {NAV_ITEMS.map((item) => (
            <SideNavItem
              key={item.path}
              icon={isActive(item.path) ? item.iconActive : item.icon}
              label={t(item.labelKey)}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </Box>
      </Stack>
    </>
  );
}

export interface AppDrawerProps {
  width: number;
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
}

export function AppDrawer({ width, open, isMobile, onClose }: AppDrawerProps) {
  const theme = useTheme();
  const bg =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[900];

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      open={open}
      onClose={onClose}
      sx={{
        width,
        flexShrink: 0,
        display: "flex",
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          backgroundColor: bg,
          borderRight: "initial",
        },
      }}
    >
      <DrawerContent onClose={onClose} />
    </Drawer>
  );
}
