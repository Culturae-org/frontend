import type { ThemeOptions } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

const light: ThemeOptions["palette"] = {
  mode: "light",
  secondary: { main: "#5c6066", contrastText: "#ffffff" },
  background: { default: "#f5f5f5", paper: "#ffffff" },
  text: { primary: "#1a1c2e", secondary: "#5c6066", disabled: "#96989e" },
  divider: "#e0e0e0",
  error: { main: "#c5341c" },
  warning: { main: "#ed6c02" },
  info: { main: "#0288d1" },
  success: { main: "#2e7d32" },
};

const dark: ThemeOptions["palette"] = {
  mode: "dark",
  secondary: { main: "#b4b8bf", contrastText: "#000000" },
  background: { default: "#121212", paper: "#121212" },
  text: { primary: "#fafafa", secondary: "#b4b8bf", disabled: "#5c6066" },
  divider: "rgba(255, 255, 255, 0.1)",
  error: { main: "#f76d4c" },
  warning: { main: "#ff9d33" },
  info: { main: "#4fb6f3" },
  success: { main: "#60ad5e" },
};

export const ACCENT_COLORS = [
  { label: "Default", value: "#444444" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Pink", value: "#db2777" },
  { label: "Rose", value: "#e11d48" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#d97706" },
  { label: "Teal", value: "#0d9488" },
  { label: "Green", value: "#16a34a" },
  { label: "Cyan", value: "#0891b2" },
  { label: "Gray", value: "#5c6066" },
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number]["value"];

export function getTheme(mode: "light" | "dark", accentColor?: string) {
  const basePalette = mode === "light" ? light : dark;
  const accent = accentColor || ACCENT_COLORS[0].value;

  const palette = {
    ...basePalette,
    primary: {
      main: accent,
      contrastText: "#ffffff",
    },
  };

  return createTheme({
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      button: { textTransform: "none" },
    },
    palette: palette as ThemeOptions["palette"],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "html, body": { overscrollBehavior: "none" },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: "none", borderRadius: 8 },
        },
      },
      MuiTab: { styleOverrides: { root: { textTransform: "none" } } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiSkeleton: { defaultProps: { animation: "wave" } },
      MuiTextField: { defaultProps: { variant: "outlined", size: "small" } },
      MuiTooltip: { defaultProps: { enterDelay: 500 } },
      MuiMenu: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: "8px",
            ...(theme.palette.mode === "dark" && { backgroundColor: "#2e2e2e" }),
          }),
          list: { padding: "4px 0" },
        },
        defaultProps: {
          slotProps: { paper: { elevation: 3 } },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            margin: "0px 4px",
            paddingLeft: "8px",
            paddingRight: "8px",
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: "8px",
            ...(theme.palette.mode === "dark" && { backgroundColor: "#2e2e2e" }),
          }),
        },
        defaultProps: {
          slotProps: { paper: { elevation: 3 } },
        },
      },
      MuiDialogContent: { styleOverrides: { root: { paddingTop: "0 !important" } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    },
  });
}
