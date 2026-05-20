import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import type { AuthConfig } from "@/lib/types/settings.types";

export default function AuthTab() {
  const { values, updateProperty } = useSettingsContext<AuthConfig>();

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        Token &amp; Session Configuration
      </Typography>
      <SettingSectionContent>
        <SettingForm title="Access Token TTL (minutes)">
          <TextField
            type="number"
            size="small"
            value={values.access_token_ttl_minutes}
            onChange={(e) => updateProperty("access_token_ttl_minutes", Number(e.target.value))}
            helperText="Short-lived JWT lifetime. Default: 15"
          />
        </SettingForm>
        <SettingForm title="Refresh Token TTL (days)">
          <TextField
            type="number"
            size="small"
            value={values.refresh_token_ttl_days}
            onChange={(e) => updateProperty("refresh_token_ttl_days", Number(e.target.value))}
            helperText="Long-lived refresh token lifetime. Default: 7"
          />
        </SettingForm>
        <SettingForm title="Session TTL (days)">
          <TextField
            type="number"
            size="small"
            value={values.session_ttl_days}
            onChange={(e) => updateProperty("session_ttl_days", Number(e.target.value))}
            helperText="Overall session lifetime. Default: 30"
          />
        </SettingForm>
        <SettingForm title="Max Concurrent Sessions">
          <TextField
            type="number"
            size="small"
            value={values.max_concurrent_sessions}
            onChange={(e) => updateProperty("max_concurrent_sessions", Number(e.target.value))}
            helperText="Max simultaneous sessions per user. Default: 5"
          />
        </SettingForm>
        <SettingForm title="Failed Login Attempts">
          <TextField
            type="number"
            size="small"
            value={values.failed_login_attempts}
            onChange={(e) => updateProperty("failed_login_attempts", Number(e.target.value))}
            helperText="Attempts before temporary lockout. Default: 5"
          />
        </SettingForm>
        <SettingForm title="Login Lockout (minutes)">
          <TextField
            type="number"
            size="small"
            value={values.login_lockout_minutes}
            onChange={(e) => updateProperty("login_lockout_minutes", Number(e.target.value))}
            helperText="Lockout duration after too many failures. Default: 15"
          />
        </SettingForm>
      </SettingSectionContent>
    </SettingSection>
  );
}
