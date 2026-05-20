import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { Outlet, useLocation, useNavigation } from "react-router";
import { AppDrawer } from "@/components/Frame/AppDrawer";
import { TopAppBar } from "@/components/Frame/TopAppBar";
import "./FadeTransition.css";

const DRAWER_WIDTH = 240;

export default function NavBarFrame() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const navigation = useNavigation();
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [location, isMobile]);

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[900],
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <AppDrawer
        width={DRAWER_WIDTH}
        open={open}
        isMobile={isMobile}
        onClose={() => setOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100%",
          transition: theme.transitions.create("margin", {
            easing: open ? theme.transitions.easing.easeOut : theme.transitions.easing.sharp,
            duration: open
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : open ? 0 : `-${DRAWER_WIDTH}px`,
        }}
      >
        <TopAppBar
          drawerOpen={open}
          drawerWidth={DRAWER_WIDTH}
          isMobile={isMobile}
          onToggle={() => setOpen((v) => !v)}
        />
        <Box sx={{ ...theme.mixins.toolbar, flexShrink: 0 }} />

        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", py: { xs: 0, md: 2 }, mr: { xs: 0, md: 2 }, ml: { xs: 0, md: open ? 0 : 2 } }}>
          <SwitchTransition>
            <CSSTransition
              nodeRef={nodeRef}
              addEndListener={(done) => nodeRef.current?.addEventListener("transitionend", done, false)}
              classNames="fade"
              key={navigation.state !== "idle" ? "loading" : "idle"}
            >
              <Box ref={nodeRef} sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {navigation.state !== "idle" ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <Outlet />
                )}
              </Box>
            </CSSTransition>
          </SwitchTransition>
        </Box>
      </Box>
    </Box>
  );
}
