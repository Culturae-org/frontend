import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
      }}
    >
      <Typography variant="h1" fontWeight={700} sx={{ fontSize: "8rem", lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h5" fontWeight={600}>
        Page not found
      </Typography>
      <Typography variant="body2" color="text.secondary">
        The page you are looking for doesn&apos;t exist or has been moved.
      </Typography>
      <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>
        Go to Dashboard
      </Button>
    </Box>
  );
}
