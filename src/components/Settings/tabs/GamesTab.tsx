import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import type { GameConfig } from "@/lib/types/settings.types";

export default function GamesTab() {
  const { values, updateProperty } = useSettingsContext<GameConfig>();

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        Game TTL Configuration
      </Typography>
      <SettingSectionContent>
        <SettingForm title="Active Game TTL (minutes)">
          <TextField
            type="number"
            size="small"
            value={values.active_ttl_minutes}
            onChange={(e) => updateProperty("active_ttl_minutes", Number(e.target.value))}
            helperText="TTL for active games in Redis. Default: 1440 (24h)"
          />
        </SettingForm>
        <SettingForm title="Finished Game TTL (minutes)">
          <TextField
            type="number"
            size="small"
            value={values.finished_ttl_minutes}
            onChange={(e) => updateProperty("finished_ttl_minutes", Number(e.target.value))}
            helperText="TTL for finished games in Redis. Default: 120 (2h)"
          />
        </SettingForm>
      </SettingSectionContent>
    </SettingSection>
  );
}
