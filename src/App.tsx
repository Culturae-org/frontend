import "./globals.css";
import "./i18n";

import { ACCENT_COLORS, getTheme } from "@/theme";
import { CssBaseline, GlobalStyles, ThemeProvider, useMediaQuery } from "@mui/material";
import { ConfirmProvider } from "@/components/Common/ConfirmDialog";
import { AppProviders } from "@/lib/stores";
import { SnackbarProvider } from "notistack";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router";
import { routes } from "./router";
import CustomSnackbar from "@/components/Common/CustomSnackbar";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY_THEME = "culturae_theme";
const STORAGE_KEY_ACCENT = "culturae_accent";

interface ThemeModeCtx {
  mode: "light" | "dark";
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
}

const ThemeModeContext = createContext<ThemeModeCtx>({
  mode: "light",
  themeMode: "system",
  setThemeMode: () => {},
  accentColor: ACCENT_COLORS[0].value,
  setAccentColor: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

function ThemeModeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode) || "system";
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_ACCENT) || ACCENT_COLORS[0].value;
  });

  const mode = themeMode === "system" ? (prefersDark ? "dark" : "light") : themeMode;

  const setThemeMode = useCallback((m: ThemeMode) => {
    setThemeModeState(m);
    localStorage.setItem(STORAGE_KEY_THEME, m);
  }, []);

  const setAccentColor = useCallback((c: string) => {
    setAccentColorState(c);
    localStorage.setItem(STORAGE_KEY_ACCENT, c);
  }, []);

  const value = useMemo(
    () => ({ mode, themeMode, setThemeMode, accentColor, setAccentColor }),
    [mode, themeMode, setThemeMode, accentColor, setAccentColor],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

function AppLayout() {
  const { mode, accentColor } = useThemeMode();
  const theme = useMemo(() => getTheme(mode, accentColor), [mode, accentColor]);

  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ body: { overflowY: isMobile ? "initial" : "hidden" } }} />
      <AppProviders>
        <ConfirmProvider>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            variant="default"
            preventDuplicate
            autoHideDuration={4000}
            Components={{
              default: CustomSnackbar,
              success: CustomSnackbar,
              error: CustomSnackbar,
              warning: CustomSnackbar,
              info: CustomSnackbar,
            }}
          >
            <Outlet />
          </SnackbarProvider>
        </ConfirmProvider>
      </AppProviders>
    </ThemeProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: routes,
  },
], {
  basename: "/console",
});

export default function App() {
  return (
    <ThemeModeProvider>
      <RouterProvider router={router} />
    </ThemeModeProvider>
  );
}
