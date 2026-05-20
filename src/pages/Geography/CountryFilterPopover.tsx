import {
  Box,
  Button,
  FormControl,
  ListItemText,
  MenuItem,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { Continent, Region } from "@/lib/types/geography.types";
import { DenseSelect } from "@/components/Common/StyledComponents";

export interface GeoFilters {
  continent: string;
  region: string;
  independent: string;
  driving_side: string;
}

export const EMPTY_GEO_FILTERS: GeoFilters = {
  continent: "",
  region: "",
  independent: "",
  driving_side: "",
};

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: GeoFilters;
  continents: Continent[];
  regions: Region[];
  onApply: (f: GeoFilters) => void;
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export default function CountryFilterPopover({
  anchorEl,
  open,
  onClose,
  filters,
  continents,
  regions,
  onApply,
}: Props) {
  const [local, setLocal] = useState<GeoFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]);

  const visibleRegions = local.continent
    ? regions.filter((r) => r.continent === local.continent)
    : regions;

  const handleApply = () => { onApply(local); onClose(); };
  const handleReset = () => { onApply(EMPTY_GEO_FILTERS); setLocal(EMPTY_GEO_FILTERS); onClose(); };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { sx: { p: 2, width: 300, maxWidth: "100%" } } }}
    >
      <Stack spacing={2}>
        <FilterField label="Continent">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.continent}
              onChange={(e) => setLocal((p) => ({ ...p, continent: e.target.value as string, region: "" }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              {continents.map((c) => (
                <MenuItem key={c.slug} value={c.slug}>
                  <ListItemText slotProps={{ primary: { variant: "body2" } }}>{c.name["en"] ?? c.slug}</ListItemText>
                </MenuItem>
              ))}
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label="Region">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.region}
              onChange={(e) => setLocal((p) => ({ ...p, region: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              {visibleRegions.map((r) => (
                <MenuItem key={r.slug} value={r.slug}>
                  <ListItemText slotProps={{ primary: { variant: "body2" } }}>{r.name["en"] ?? r.slug}</ListItemText>
                </MenuItem>
              ))}
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label="Independent">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.independent}
              onChange={(e) => setLocal((p) => ({ ...p, independent: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              <MenuItem value="true"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Yes</ListItemText></MenuItem>
              <MenuItem value="false"><ListItemText slotProps={{ primary: { variant: "body2" } }}>No</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label="Driving side">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.driving_side}
              onChange={(e) => setLocal((p) => ({ ...p, driving_side: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              <MenuItem value="right"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Right</ListItemText></MenuItem>
              <MenuItem value="left"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Left</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button size="small" variant="outlined" onClick={handleReset}>Reset</Button>
          <Button size="small" variant="contained" onClick={handleApply}>Apply</Button>
        </Box>
      </Stack>
    </Popover>
  );
}
