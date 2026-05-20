import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import type { RateLimitConfig } from "@/lib/types/settings.types";

export default function RateLimitTab() {
  const { values, updateProperty } = useSettingsContext<RateLimitConfig>();

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        Rate Limiting
      </Typography>
      <SettingSectionContent>
        <SettingForm title="Enabled">
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(values.enabled)}
                onChange={(_, v) => updateProperty("enabled", v)}
              />
            }
            label="Enable rate limiting"
          />
        </SettingForm>
        <SettingForm title="Apply to Admin">
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(values.apply_to_admin)}
                onChange={(_, v) => updateProperty("apply_to_admin", v)}
              />
            }
            label="Apply rate limits to admin users"
          />
        </SettingForm>
        <SettingForm title="Max Requests">
          <TextField
            type="number"
            size="small"
            value={values.max_requests}
            onChange={(e) => updateProperty("max_requests", Number(e.target.value))}
            helperText="Maximum requests per window. Default: 60"
            disabled={!values.enabled}
          />
        </SettingForm>
        <SettingForm title="Window (seconds)">
          <TextField
            type="number"
            size="small"
            value={values.window_seconds}
            onChange={(e) => updateProperty("window_seconds", Number(e.target.value))}
            helperText="Time window for rate counting. Default: 60"
            disabled={!values.enabled}
          />
        </SettingForm>
      </SettingSectionContent>
    </SettingSection>
  );
}
