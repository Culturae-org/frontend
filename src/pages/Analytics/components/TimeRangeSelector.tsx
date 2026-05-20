import { useState } from "react";
import { Menu, MenuItem, ListItemText } from "@mui/material";
import { CalendarLtr20Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { SecondaryButton } from "@/components/Common/StyledComponents";
import type { TimeRange } from "@/lib/types/analytics.types";

const DEFAULT_OPTIONS: TimeRange[] = ["7d", "30d", "90d", "1y"];

interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
  options?: string[];
}

export function TimeRangeSelector({ value, onChange, options = DEFAULT_OPTIONS }: TimeRangeSelectorProps) {
  const { t } = useTranslation("dashboard");
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <SecondaryButton
        variant="contained"
        startIcon={<CalendarLtr20Regular />}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {t(`analytics.timeRange.${value}`)}
      </SecondaryButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        {options.map((range) => (
          <MenuItem
            key={range}
            selected={range === value}
            onClick={() => { onChange(range); setAnchor(null); }}
          >
            <ListItemText slotProps={{ primary: { variant: "body2" } }}>
              {t(`analytics.timeRange.${range}`)}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
