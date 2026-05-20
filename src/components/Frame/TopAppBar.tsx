import { useThemeMode } from "@/App";
import SearchBar from "@/components/Frame/SearchBar";
import { useAuth, useUser } from "@/lib/stores";
import { usersService } from "@/lib/services/users.service";
import {
  AppBar,
  Avatar,
  Box,
  Collapse,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  styled,
  SvgIcon,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Navigation24Regular,
  Person24Regular,
  Person20Regular,
  SignOut24Regular,
  WeatherMoon24Regular,
  WeatherSunny24Regular,
} from "@fluentui/react-icons";

function SettingIcon() {
  return (
    <SvgIcon>
      <path d="M12.012 2.25c.734.008 1.465.093 2.182.253a.75.75 0 0 1 .582.649l.17 1.527a1.384 1.384 0 0 0 1.927 1.116l1.401-.615a.75.75 0 0 1 .85.174 9.792 9.792 0 0 1 2.204 3.792.75.75 0 0 1-.271.825l-1.242.916a1.381 1.381 0 0 0 0 2.226l1.243.915a.75.75 0 0 1 .272.826 9.797 9.797 0 0 1-2.204 3.792.75.75 0 0 1-.848.175l-1.407-.617a1.38 1.38 0 0 0-1.926 1.114l-.169 1.526a.75.75 0 0 1-.572.647 9.518 9.518 0 0 1-4.406 0 .75.75 0 0 1-.572-.647l-.168-1.524a1.382 1.382 0 0 0-1.926-1.11l-1.406.616a.75.75 0 0 1-.849-.175 9.798 9.798 0 0 1-2.204-3.796.75.75 0 0 1 .272-.826l1.243-.916a1.38 1.38 0 0 0 0-2.226l-1.243-.914a.75.75 0 0 1-.271-.826 9.793 9.793 0 0 1 2.204-3.792.75.75 0 0 1 .85-.174l1.4.615a1.387 1.387 0 0 0 1.93-1.118l.17-1.526a.75.75 0 0 1 .583-.65c.717-.159 1.45-.243 2.201-.252ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </SvgIcon>
  );
}
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const SquareMenuItem = styled(MenuItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  "&:hover .MuiListItemIcon-root": {
    color: theme.palette.primary.main,
  },
}));

function UserPopover({
  anchorEl,
  open,
  onClose,
}: {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("dashboard");
  const { logout } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const handleViewProfile = () => {
    onClose();
    navigate(`/users?view=${user!.id}`);
  };

  if (!user) return null;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          elevation: 0,
          sx: { border: 1, borderColor: "divider", mt: 0.5, minWidth: 230 },
        },
      }}
    >
      <Box sx={{ px: 1.5, py: 1.25, display: "flex", flexDirection: "column", gap: "4px", maxWidth: 300 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography variant="body2" fontWeight={600} lineHeight={1}>
            {user.username}
          </Typography>
          <Typography variant="body2" color="text.secondary" lineHeight={1}>
            {user.role}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" lineHeight={1}>
          {user.email}
        </Typography>
      </Box>

      <Divider />

      <MenuList dense sx={{ mx: 0.5, py: 0.5 }}>
        <SquareMenuItem onClick={handleViewProfile}>
          <ListItemIcon>
            <Person20Regular style={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>{t("frame.viewProfile")}</ListItemText>
        </SquareMenuItem>
        <SquareMenuItem onClick={handleLogout}>
          <ListItemIcon>
            <SignOut24Regular style={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>{t("frame.logout")}</ListItemText>
        </SquareMenuItem>
      </MenuList>
    </Popover>
  );
}

interface TopAppBarProps {
  drawerOpen: boolean;
  drawerWidth: number;
  isMobile: boolean;
  onToggle: () => void;
}

export function TopAppBar({ drawerOpen, drawerWidth, isMobile, onToggle }: TopAppBarProps) {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const { mode, themeMode, setThemeMode } = useThemeMode();
  const { user } = useUser();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const appBarBg =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[900];

  const handleThemeToggle = () => {
    if (themeMode === "system") {
      setThemeMode(mode === "dark" ? "light" : "dark");
    } else {
      setThemeMode(themeMode === "dark" ? "light" : "dark");
    }
  };

  return (
    <>
      <AppBar
        elevation={0}
        enableColorOnDark
        position="fixed"
        sx={(t) => ({
          transition: t.transitions.create(["margin", "width"], {
            easing: t.transitions.easing.sharp,
            duration: t.transitions.duration.leavingScreen,
          }),
          backgroundColor: appBarBg,
          color: t.palette.getContrastText(appBarBg),
          ...(!isMobile &&
            drawerOpen && {
              width: `calc(100% - ${drawerWidth}px)`,
              marginLeft: `${drawerWidth}px`,
              transition: t.transitions.create(["margin", "width"], {
                easing: t.transitions.easing.easeOut,
                duration: t.transitions.duration.enteringScreen,
              }),
            }),
        })}
      >
        <Toolbar
          sx={{
            "&.MuiToolbar-root.MuiToolbar-gutters": {
              paddingLeft: drawerOpen && !isMobile ? 0 : theme.spacing(isMobile ? 2 : 3),
              transition: theme.transitions.create("padding", {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
              }),
            },
          }}
        >
          <Collapse orientation="horizontal" in={!drawerOpen || isMobile}>
            <IconButton
              onClick={onToggle}
              edge="start"
              sx={{ mr: isMobile ? 1 : 2, ml: isMobile ? -1 : -1.5 }}
            >
              <Navigation24Regular />
            </IconButton>
          </Collapse>

          {!isMobile && (
            <Box sx={{ ml: 1, height: 42 }}>
              <SearchBar />
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" alignItems="center">
            {isMobile && <SearchBar />}

            <Tooltip title={mode === "dark" ? t("frame.lightMode") : t("frame.darkMode")}>
              <IconButton size="large" onClick={handleThemeToggle}>
                {mode === "dark" ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
              </IconButton>
            </Tooltip>

            <Tooltip title={t("nav.settings")}>
              <IconButton size="large" onClick={() => navigate("/settings")}>
                <SettingIcon />
              </IconButton>
            </Tooltip>

            <IconButton size="large" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                sx={{ width: 30, height: 30, fontSize: "0.8rem" }}
                src={user?.has_avatar ? usersService.getAvatarUrl(user.id, new Date(user.updated_at).getTime()) : undefined}
              >
                {user?.username?.[0]?.toUpperCase() ?? <Person24Regular style={{ width: 18, height: 18 }} />}
              </Avatar>
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <UserPopover anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} />
    </>
  );
}
