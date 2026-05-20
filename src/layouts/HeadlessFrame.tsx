import LanguageSwitcher from "@/components/Common/LanguageSwitcher";
import { Box, Container, Divider, Grid2, Link, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

function HeadlessFooterLinks() {
  const { t } = useTranslation("dashboard");

  return (
    <Box
      sx={{
        mt: 2.5,
        textAlign: "center",
        typography: "caption",
        color: "text.secondary",
      }}
    >
      <Link
        href="#"
        underline="hover"
        color="inherit"
        sx={{ fontSize: "inherit" }}
      >
        {t("frame.termsOfUse")}
      </Link>
      {" | "}
      <Link
        href="#"
        underline="hover"
        color="inherit"
        sx={{ fontSize: "inherit" }}
      >
        {t("frame.privacyPolicy")}
      </Link>
    </Box>
  );
}

function PoweredBy() {
  const { t } = useTranslation("dashboard");

  return (
    <Box
      sx={{
        mt: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
      }}
    >
      <Typography variant="caption" color="text.disabled" fontWeight={500}>
        {t("frame.poweredBy")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          opacity: 0.4,
          transition: "opacity 0.2s",
          "&:hover": { opacity: 1 },
          "& img": { filter: "grayscale(100%)", transition: "filter 0.2s" },
          "&:hover img": { filter: "grayscale(0%)" },
        }}
      >
        <img src={`${import.meta.env.BASE_URL}culturae.png`} alt="Culturae" style={{ width: 14, height: 14, borderRadius: "50%" }} />
        <Typography variant="caption" fontWeight={700} color="text.primary">
          Culturae
        </Typography>
      </Box>
    </Box>
  );
}

export default function HeadlessFrame() {
  return (
    <Box
      sx={{
        backgroundColor: (t) =>
          t.palette.mode === "light"
            ? t.palette.grey[100]
            : t.palette.grey[900],
        flexGrow: 1,
        minHeight: "100vh",
        overflow: "auto",
      }}
    >
      <Container maxWidth="xs">
        <Grid2
          container
          direction="column"
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: "100vh", py: 4 }}
        >
          <Box sx={{ width: "100%" }}>
            <Paper
              sx={{
                pt: 2,
                px: 3,
                pb: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <img src={`${import.meta.env.BASE_URL}culturae.png`} alt="Culturae" style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0 }} />
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      lineHeight={1.2}
                    >
                      Culturae
                    </Typography>
                  </Box>
                </Box>

                <LanguageSwitcher />
              </Box>

              <Outlet />

              <Divider sx={{ mt: 3 }} />
              <HeadlessFooterLinks />
            </Paper>

            <PoweredBy />
          </Box>
        </Grid2>
      </Container>
    </Box>
  );
}
