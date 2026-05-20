import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { useThemeMode } from "@/App";
import { OPENAPI_ENDPOINTS } from "@/lib/api/endpoints";

export default function ApiExplorerPage() {
  const theme = useTheme();
  const { mode } = useThemeMode();

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        "& .scalar-app": {
          fontFamily: theme.typography.fontFamily,
        },
      }}
    >
      <ApiReferenceReact
        configuration={{
          spec: { url: OPENAPI_ENDPOINTS.SPEC },
          darkMode: mode === "dark",
          hideModels: false,
          hideDownloadButton: false,
          defaultHttpClient: {
            targetKey: "shell",
            clientKey: "curl",
          },
          authentication: {
            preferredSecurityScheme: "bearerAuth",
          },
        }}
      />
    </Box>
  );
}
