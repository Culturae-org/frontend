import { useAuth } from "@/lib/stores";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ArrowBack from "@mui/icons-material/ArrowBack";

enum LoginPhase {
  CollectEmail,
  CollectPassword,
}

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const { t } = useTranslation("dashboard");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<LoginPhase>(LoginPhase.CollectEmail);
  const [email, setEmail] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    watch,
  } = useForm<LoginForm>();

  const password = watch("password");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleContinue = (email: string) => {
    if (!email || !email.includes("@")) {
      setError(t("login.error"));
      return;
    }
    setError(null);
    setEmail(email);
    setPhase(LoginPhase.CollectPassword);
  };

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("login.error"));
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {t("login.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {t("login.subtitle")}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {phase === LoginPhase.CollectEmail ? (
          <>
            <TextField
              {...register("email", { required: true })}
              label={t("login.identifier")}
              autoComplete="email"
              autoFocus
              fullWidth
              disabled={isSubmitting}
              type="email"
            />
            <Button
              type="button"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{ mt: 0.5 }}
              onClick={() => {
                const emailValue = watch("email");
                handleContinue(emailValue);
              }}
            >
              {t("login.submit")}
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("login.continuingAs")} <strong>{email}</strong>
            </Typography>

            <TextField
              {...register("password", { required: true })}
              label={t("login.password")}
              type="password"
              autoComplete="current-password"
              autoFocus
              fullWidth
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{ mt: 0.5 }}
            >
              {isSubmitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                t("login.submit")
              )}
            </Button>

            <Button
              type="button"
              startIcon={<ArrowBack />}
              fullWidth
              disabled={isSubmitting}
              onClick={() => {
                setPhase(LoginPhase.CollectEmail);
                setError(null);
              }}
              sx={{ mt: 1 }}
            >
              {t("login.back") || "Back"}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
