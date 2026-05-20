import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import type { ELOConfig } from "@/lib/types/settings.types";

export default function ELOConfigTab() {
  const { values, updateProperty } = useSettingsContext<ELOConfig>();

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        ELO Rating Configuration
      </Typography>
      <SettingSectionContent>
        <SettingForm title="K-Factor (Low Games)">
          <TextField
            type="number"
            size="small"
            value={values.k_factor_low_games}
            onChange={(e) => updateProperty("k_factor_low_games", Number(e.target.value))}
            helperText="K-factor for new players (&lt; threshold games). Default: 32"
          />
        </SettingForm>
        <SettingForm title="K-Factor (High Games)">
          <TextField
            type="number"
            size="small"
            value={values.k_factor_high_games}
            onChange={(e) => updateProperty("k_factor_high_games", Number(e.target.value))}
            helperText="K-factor for experienced players (&ge; threshold). Default: 16"
          />
        </SettingForm>
        <SettingForm title="K-Factor Threshold">
          <TextField
            type="number"
            size="small"
            value={values.k_factor_threshold}
            onChange={(e) => updateProperty("k_factor_threshold", Number(e.target.value))}
            helperText="Games-played threshold to switch K-factor. Default: 30"
          />
        </SettingForm>
        <SettingForm title="Minimum Rating">
          <TextField
            type="number"
            size="small"
            value={values.min_rating}
            onChange={(e) => updateProperty("min_rating", Number(e.target.value))}
            helperText="ELO rating floor. Default: 0"
          />
        </SettingForm>
        <SettingForm title="Maximum Rating">
          <TextField
            type="number"
            size="small"
            value={values.max_rating}
            onChange={(e) => updateProperty("max_rating", Number(e.target.value))}
            helperText="ELO rating ceiling. Default: 9999"
          />
        </SettingForm>
      </SettingSectionContent>
    </SettingSection>
  );
}
