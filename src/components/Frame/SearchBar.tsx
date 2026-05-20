import {
  alpha,
  Box,
  Button,
  Dialog,
  Divider,
  Grow,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  styled,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Search20Regular,
  Search24Regular,
  DismissCircle20Regular,
} from "@fluentui/react-icons";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { TransitionProps } from "@mui/material/transitions";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const GrowTransition = forwardRef(function GrowTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Grow ref={ref} {...props} />;
});

const StyledDialog = styled(Dialog)({
  "& .MuiDialog-container": {
    alignItems: "flex-start",
  },
});

const SearchInput = styled(TextField)({
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiOutlinedInput-root": {
    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
});

const KeyIndicator = styled("code")(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "light"
      ? theme.palette.grey[200]
      : theme.palette.grey[800],
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === "light"
      ? "0 1px 1px rgba(0,0,0,0.15), 0 2px 0 0 rgba(255,255,255,0.7) inset"
      : "0 1px 1px rgba(0,0,0,0.2), 0 2px 0 0 #3d3e42 inset",
  padding: "0 5px",
  borderRadius: 4,
  fontSize: "0.72rem",
  fontFamily: "inherit",
  lineHeight: 1.6,
  color: "inherit",
}));

const SearchButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.disabled,
  border: `1px solid ${theme.palette.divider}`,
  justifyContent: "flex-start",
  textTransform: "none",
  fontWeight: 400,
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  minWidth: 200,
  height: "100%",
  gap: theme.spacing(1),
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderColor: theme.palette.primary.main,
    color: theme.palette.text.disabled,
  },
}));

interface QuickLink {
  label: string;
  path: string;
  group?: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: "nav.dashboard", path: "/" },
  { label: "nav.users", path: "/users" },
  { label: "nav.games", path: "/games" },
  { label: "nav.reports", path: "/reports" },
  { label: "nav.datasets", path: "/datasets" },
  { label: "nav.questions", path: "/questions" },
  { label: "nav.geography", path: "/geography" },
  { label: "nav.settings", path: "/settings" },
  { label: "nav.games", path: "/games" },
  { label: 'nav.analytics', path: "/analytics" },
  {
    label: "games.status.in_progress",
    path: "/games?status=in_progress",
    group: "Games",
  },
  { label: "games.mode.solo", path: "/games?mode=solo", group: "Games" },
  { label: "games.mode.1v1", path: "/games?mode=1v1", group: "Games" },
  { label: "games.mode.multi", path: "/games?mode=multi", group: "Games" },
  { label: "nav.logs", path: "/logs" },
  { label: "logs.tabs.admin", path: "/logs?actions=admin", group: "Logs" },
  { label: "logs.tabs.users", path: "/logs?actions=users", group: "Logs" },
  { label: "nav.pods", path: "/pods" },
  { label: "nav.templates", path: "/templates" },
  { label: "Create", path: "/users?action=create", group: "Users" },
  { label: "Import", path: "/datasets?action=import", group: "Datasets" },
  {
    label: "Create",
    path: "/templates?action=create",
    group: "Game Templates",
  },
  {
    label: "Seed defaults",
    path: "/templates?action=seed",
    group: "Game Templates",
  },
  {
    label: "settings.tabs.system",
    path: "/settings?tab=system",
    group: "Settings",
  },
  {
    label: "settings.tabs.auth",
    path: "/settings?tab=auth",
    group: "Settings",
  },
  { label: "settings.tabs.xp", path: "/settings?tab=xp", group: "Settings" },
  { label: "settings.tabs.elo", path: "/settings?tab=elo", group: "Settings" },
  {
    label: "settings.tabs.game",
    path: "/settings?tab=games",
    group: "Settings",
  },
  {
    label: "settings.tabs.websocket",
    path: "/settings?tab=websocket",
    group: "Settings",
  },
  {
    label: "settings.tabs.avatar",
    path: "/settings?tab=avatar",
    group: "Settings",
  },
  {
    label: "settings.tabs.theme",
    path: "/settings?tab=theme",
    group: "Settings",
  },
  {
    label: "settings.tabs.countdown",
    path: "/settings?tab=countdown",
    group: "Settings",
  },
  {
    label: "settings.tabs.ratelimit",
    path: "/settings?tab=ratelimit",
    group: "Settings",
  },
  {
    label: "settings.tabs.maintenance",
    path: "/settings?tab=maintenance",
    group: "Settings",
  },
  {
    label: "settings.tabs.version",
    path: "/settings?tab=version",
    group: "Settings",
  },
];

function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = QUICK_LINKS.filter((l) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      t(l.label).toLowerCase().includes(q) ||
      (l.group?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slots={{ transition: GrowTransition }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <SearchInput
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          autoFocus
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && filtered.length > 0)
              handleSelect(filtered[0].path);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search20Regular style={{ opacity: 0.5, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery("")}>
                    <DismissCircle20Regular style={{ opacity: 0.5 }} />
                  </IconButton>
                </InputAdornment>
              ) : (
                <InputAdornment position="end">
                  <KeyIndicator style={{ opacity: 0.5 }}>Esc</KeyIndicator>
                </InputAdornment>
              ),
              sx: { fontSize: "0.95rem", height: 52 },
            },
          }}
        />
      </Box>

      <Divider />

      <List
        dense
        disablePadding
        sx={{ py: 0.5, maxHeight: 340, overflow: "auto" }}
      >
        {filtered.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 1.5 }}
          >
            {t("search.noResults")}
          </Typography>
        ) : (
          filtered.map((link) => (
            <ListItemButton
              key={link.path}
              onClick={() => handleSelect(link.path)}
              sx={{ px: 2, mx: 0.5, borderRadius: 1 }}
            >
              <ListItemText
                primary={
                  link.group ? (
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {link.group}
                        {" › "}
                      </Typography>
                      {t(link.label)}
                    </>
                  ) : (
                    t(link.label)
                  )
                }
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItemButton>
          ))
        )}
      </List>
    </StyledDialog>
  );
}

export default function SearchBar() {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {isMobile ? (
        <IconButton onClick={() => setOpen(true)}>
          <Search24Regular />
        </IconButton>
      ) : (
        <SearchButton
          onClick={() => setOpen(true)}
          variant="outlined"
          startIcon={
            <Search20Regular style={{ color: theme.palette.primary.main }} />
          }
        >
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ flexGrow: 1, textAlign: "left" }}
          >
            {t("search.placeholder")}
          </Typography>
          <KeyIndicator>/</KeyIndicator>
        </SearchButton>
      )}

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
