import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import type { CountdownConfig } from "@/lib/types/settings.types";

export default function CountdownTab() {
  const { values, updateProperty } = useSettingsContext<CountdownConfig>();

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        Game Countdown Configuration
      </Typography>
      <SettingSectionContent>
        <SettingForm title="Pre-Game Countdown (seconds)">
          <TextField
            type="number"
            size="small"
            value={values.pre_game_countdown_seconds}
            onChange={(e) => updateProperty("pre_game_countdown_seconds", Number(e.target.value))}
            helperText="Countdown before a game starts. Default: 5"
          />
        </SettingForm>
        <SettingForm title="Reconnect Grace Period (seconds)">
          <TextField
            type="number"
            size="small"
            value={values.reconnect_grace_period_seconds}
            onChange={(e) => updateProperty("reconnect_grace_period_seconds", Number(e.target.value))}
            helperText="Time allowed for a player to reconnect. Default: 30"
          />
        </SettingForm>
      </SettingSectionContent>
    </SettingSection>
  );
}
