import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { XPConfig } from "@/lib/types/settings.types";

export default function XPConfigTab() {
  const { values, updateProperty } = useSettingsContext<XPConfig>();

  return (
    <>
      <SettingSection>
        <Typography variant="h6" gutterBottom>
          XP Formula
        </Typography>
        <SettingSectionContent>
          <SettingForm title="Base XP">
            <TextField
              type="number"
              size="small"
              value={values.base_xp}
              onChange={(e) => updateProperty("base_xp", Number(e.target.value))}
              helperText="Base XP for level formula. Default: 2000"
            />
          </SettingForm>
          <SettingForm title="Growth Rate">
            <TextField
              type="number"
              size="small"
              value={values.growth_rate}
              onChange={(e) => updateProperty("growth_rate", Number(e.target.value))}
              helperText="Growth exponent for level formula. Default: 1.5"
            />
          </SettingForm>
          <SettingForm title="Winner Bonus">
            <TextField
              type="number"
              size="small"
              value={values.winner_bonus}
              onChange={(e) => updateProperty("winner_bonus", Number(e.target.value))}
              helperText="Flat XP bonus for the winner in 1v1 mode. Default: 100"
            />
          </SettingForm>
        </SettingSectionContent>
      </SettingSection>

      <SettingSection>
        <Typography variant="h6" gutterBottom>
          Mode Multipliers
        </Typography>
        <SettingSectionContent>
          <SettingForm title="Solo Multiplier">
            <TextField
              type="number"
              size="small"
              value={values.solo_multiplier}
              onChange={(e) => updateProperty("solo_multiplier", Number(e.target.value))}
              helperText="XP multiplier for solo games. Default: 0.5"
            />
          </SettingForm>
          <SettingForm title="1v1 Multiplier">
            <TextField
              type="number"
              size="small"
              value={values.onevone_multiplier}
              onChange={(e) => updateProperty("onevone_multiplier", Number(e.target.value))}
              helperText="XP multiplier for 1v1 games. Default: 1.0"
            />
          </SettingForm>
          <SettingForm title="Multi Multiplier">
            <TextField
              type="number"
              size="small"
              value={values.multi_multiplier}
              onChange={(e) => updateProperty("multi_multiplier", Number(e.target.value))}
              helperText="XP multiplier for multi-player games. Default: 1.0"
            />
          </SettingForm>
        </SettingSectionContent>
      </SettingSection>

    </>
  );
}
