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
import { DenseSelect } from "@/components/Common/StyledComponents";

export interface QuestionFilters {
  difficulty: string;
  qtype: string;
  theme: string;
}

export const EMPTY_QUESTION_FILTERS: QuestionFilters = {
  difficulty: "",
  qtype: "",
  theme: "",
};

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: QuestionFilters;
  themes: Array<{ id: string; slug: string }>;
  onApply: (f: QuestionFilters) => void;
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

export default function QuestionFilterPopover({ anchorEl, open, onClose, filters, themes, onApply }: Props) {
  const [local, setLocal] = useState<QuestionFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => { onApply(local); onClose(); };
  const handleReset = () => { onApply(EMPTY_QUESTION_FILTERS); setLocal(EMPTY_QUESTION_FILTERS); onClose(); };

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
        <FilterField label="Difficulty">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.difficulty}
              onChange={(e) => setLocal((p) => ({ ...p, difficulty: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              <MenuItem value="easy"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Easy</ListItemText></MenuItem>
              <MenuItem value="medium"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Medium</ListItemText></MenuItem>
              <MenuItem value="hard"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Hard</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label="Type">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.qtype}
              onChange={(e) => setLocal((p) => ({ ...p, qtype: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              <MenuItem value="mcq"><ListItemText slotProps={{ primary: { variant: "body2" } }}>MCQ</ListItemText></MenuItem>
              <MenuItem value="text_input"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Text input</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label="Theme">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.theme}
              onChange={(e) => setLocal((p) => ({ ...p, theme: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              {themes.map((t) => (
                <MenuItem key={t.id} value={t.slug}>
                  <ListItemText slotProps={{ primary: { variant: "body2" } }}>{t.slug}</ListItemText>
                </MenuItem>
              ))}
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
