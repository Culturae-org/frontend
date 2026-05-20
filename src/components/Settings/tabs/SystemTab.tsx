import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormHelperText from "@mui/material/FormHelperText";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import type { SystemConfig } from "@/lib/types/settings.types";

const NoMarginHelperText = FormHelperText;

export default function SystemTab() {
  const { values, updateProperty } = useSettingsContext<SystemConfig>();

  return (
    <>
      <SettingSection>
        <Typography variant="h6" gutterBottom>
          Cache &amp; Cleanup
        </Typography>
        <SettingSectionContent>
          <SettingForm title="User Cache TTL (minutes)">
            <TextField
              type="number"
              size="small"
              value={values.user_cache_ttl_minutes}
              onChange={(e) => updateProperty("user_cache_ttl_minutes", Number(e.target.value))}
              helperText="Default: 1440 (24h)"
            />
          </SettingForm>
          <SettingForm title="Cleanup Interval (minutes)">
            <TextField
              type="number"
              size="small"
              value={values.cleanup_interval_minutes}
              onChange={(e) => updateProperty("cleanup_interval_minutes", Number(e.target.value))}
              helperText="Background cleanup interval. Default: 5"
            />
          </SettingForm>
          <SettingForm title="Analytics Active Days">
            <TextField
              type="number"
              size="small"
              value={values.analytics_active_days}
              onChange={(e) => updateProperty("analytics_active_days", Number(e.target.value))}
              helperText="Days before moving analytics to archive. Default: 1"
            />
          </SettingForm>
          <SettingForm title="Analytics Archive Days">
            <TextField
              type="number"
              size="small"
              value={values.analytics_archive_days}
              onChange={(e) => updateProperty("analytics_archive_days", Number(e.target.value))}
              helperText="Days to retain archived analytics. Default: 30"
            />
          </SettingForm>
        </SettingSectionContent>
      </SettingSection>

      <SettingSection>
        <Typography variant="h6" gutterBottom>
          WebSocket Delays
        </Typography>
        <SettingSectionContent>
          <SettingForm title="Offline Delay (seconds)">
            <TextField
              type="number"
              size="small"
              value={values.offline_delay_seconds}
              onChange={(e) => updateProperty("offline_delay_seconds", Number(e.target.value))}
              helperText="Seconds before marking user offline after disconnect. Default: 2"
            />
          </SettingForm>
          <SettingForm title="Game Leave Delay (seconds)">
            <TextField
              type="number"
              size="small"
              value={values.game_leave_delay_seconds}
              onChange={(e) => updateProperty("game_leave_delay_seconds", Number(e.target.value))}
              helperText="Seconds before removing player after disconnect. Default: 30"
            />
          </SettingForm>
        </SettingSectionContent>
      </SettingSection>

      <SettingSection>
        <Typography variant="h6" gutterBottom>
          Scheduled Tasks
        </Typography>
        <SettingSectionContent>
          <SettingForm title="Dataset Update Check">
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.dataset_check_enabled)}
                    onChange={(_, v) => updateProperty("dataset_check_enabled", v)}
                  />
                }
                label="Enable automatic checks"
              />
              <TextField
                fullWidth
                size="small"
                value={values.dataset_check_cron}
                onChange={(e) => updateProperty("dataset_check_cron", e.target.value)}
                helperText="Cron expression. Default: 0 * * * *"
                disabled={!values.dataset_check_enabled}
              />
            </Stack>
          </SettingForm>
          <SettingForm title="Version Check">
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(values.version_check_enabled)}
                  onChange={(_, v) => updateProperty("version_check_enabled", v)}
                />
              }
              label="Enable automatic version checks"
            />
          </SettingForm>
          <SettingForm title="Session Cleanup">
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.session_cleanup_enabled)}
                    onChange={(_, v) => updateProperty("session_cleanup_enabled", v)}
                  />
                }
                label="Enable session cleanup"
              />
              <TextField
                fullWidth
                size="small"
                value={values.session_cleanup_cron}
                onChange={(e) => updateProperty("session_cleanup_cron", e.target.value)}
                helperText="Cron expression. Default: 0 * * * *"
                disabled={!values.session_cleanup_enabled}
              />
            </Stack>
          </SettingForm>
          <SettingForm title="Game Cleanup">
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.game_cleanup_enabled)}
                    onChange={(_, v) => updateProperty("game_cleanup_enabled", v)}
                  />
                }
                label="Enable abandoned-game cleanup"
              />
              <TextField
                fullWidth
                size="small"
                value={values.game_cleanup_cron}
                onChange={(e) => updateProperty("game_cleanup_cron", e.target.value)}
                helperText='Cron expression. Default: */5 * * * *'
                disabled={!values.game_cleanup_enabled}
              />
            </Stack>
          </SettingForm>
        </SettingSectionContent>
      </SettingSection>
    </>
  );
}
