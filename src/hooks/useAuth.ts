"use client";

import { useAuth as useAuthStore } from "@/lib/stores/auth.store";
import { useUser } from "@/lib/stores/user.store";
import { useNavigate } from "react-router";
import { enqueueSnackbar } from "notistack";

export function useAuth() {
  const auth = useAuthStore();
  const { clearUser } = useUser();
  const navigate = useNavigate();

  const loginAndRedirect = async (
    identifier: string,
    password: string,
    redirectTo = "/",
  ) => {
    try {
      await auth.login(identifier, password);
      enqueueSnackbar("Logged in successfully", { variant: "success" });
      navigate(redirectTo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      enqueueSnackbar(message, { variant: "error" });
      throw error;
    }
  };

  const logoutAndRedirect = async (redirectTo = "/login") => {
    try {
      await auth.logout();
      clearUser();
      enqueueSnackbar("Logged out successfully", { variant: "success" });
      navigate(redirectTo);
    } catch (error) {
      console.error("Logout error:", error);
      clearUser();
      navigate(redirectTo);
    }
  };

  const requireAuth = (redirectTo = "/login") => {
    if (!auth.isAuthenticated) {
      enqueueSnackbar("Please login to continue", { variant: "error" });
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  return {
    ...auth,
    loginAndRedirect,
    logoutAndRedirect,
    requireAuth,
  };
}
