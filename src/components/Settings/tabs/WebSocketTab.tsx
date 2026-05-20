import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import type { WebSocketConfig } from "@/lib/types/settings.types";

export default function WebSocketTab() {
  const { values, updateProperty } = useSettingsContext<WebSocketConfig>();

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        WebSocket Configuration
      </Typography>
      <SettingSectionContent>
        <SettingForm title="Write Wait (seconds)">
          <TextField
            type="number"
            size="small"
            value={values.write_wait_seconds}
            onChange={(e) => updateProperty("write_wait_seconds", Number(e.target.value))}
            helperText="Time allowed to write a message to the peer. Default: 10"
          />
        </SettingForm>
        <SettingForm title="Pong Wait (seconds)">
          <TextField
            type="number"
            size="small"
            value={values.pong_wait_seconds}
            onChange={(e) => updateProperty("pong_wait_seconds", Number(e.target.value))}
            helperText="Time allowed to read the next pong message. Default: 60"
          />
        </SettingForm>
        <SettingForm title="Max Message Size (KB)">
          <TextField
            type="number"
            size="small"
            value={values.max_message_size_kb}
            onChange={(e) => updateProperty("max_message_size_kb", Number(e.target.value))}
            helperText="Maximum message size allowed. Default: 512"
          />
        </SettingForm>
        <SettingForm title="Message Rate Limit">
          <TextField
            type="number"
            size="small"
            value={values.message_rate_limit}
            onChange={(e) => updateProperty("message_rate_limit", Number(e.target.value))}
            helperText="Max messages per window. Default: 100"
          />
        </SettingForm>
        <SettingForm title="Message Rate Window (seconds)">
          <TextField
            type="number"
            size="small"
            value={values.message_rate_window_seconds}
            onChange={(e) => updateProperty("message_rate_window_seconds", Number(e.target.value))}
            helperText="Time window for message rate counting. Default: 60"
          />
        </SettingForm>
        <SettingForm title="Reconnect Grace Period (seconds)">
          <TextField
            type="number"
            size="small"
            value={values.reconnect_grace_period_seconds}
            onChange={(e) => updateProperty("reconnect_grace_period_seconds", Number(e.target.value))}
            helperText="Time allowed for a client to reconnect. Default: 30"
          />
        </SettingForm>
      </SettingSectionContent>
    </SettingSection>
  );
}
