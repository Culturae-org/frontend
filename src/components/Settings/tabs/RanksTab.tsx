import { useSettingsContext } from "../SettingsTabPanel";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import { useEffect, useRef, useState } from "react";
import {
  Delete20Regular,
  Add24Regular,
  ReOrderDotsVertical20Regular,
} from "@fluentui/react-icons";
import type { XPConfig, RankDefinition } from "@/lib/types/settings.types";
import { SecondaryButton } from "@/components/Common/StyledComponents";

export default function RanksTab() {
  const { values, updateProperty } = useSettingsContext<XPConfig>();
  const [levelInputs, setLevelInputs] = useState<Record<number, string>>({});
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);
  const levelRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const levelCounts = (values.ranks ?? []).reduce<Record<number, number>>(
    (acc, r) => {
      acc[r.min_level] = (acc[r.min_level] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const isDuplicate = (index: number) =>
    (levelCounts[values.ranks[index]?.min_level] ?? 0) > 1;

  useEffect(() => {
    (values.ranks ?? []).forEach((_, i) => {
      const input = levelRefs.current[i];
      if (input) {
        input.setCustomValidity(isDuplicate(i) ? "Duplicate min level" : "");
      }
    });
  });

  const updateRank = (
    index: number,
    field: keyof RankDefinition,
    value: string | number,
  ) => {
    const newRanks = [...values.ranks];
    newRanks[index] = { ...newRanks[index], [field]: value };
    updateProperty("ranks", newRanks);
  };

  const addRank = () => {
    updateProperty("ranks", [...values.ranks, { name: "", min_level: 0 }]);
  };

  const removeRank = (index: number) => {
    updateProperty(
      "ranks",
      values.ranks.filter((_, i) => i !== index),
    );
    setLevelInputs((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleDrop = (toIndex: number) => {
    const fromIndex = dragIndex.current;
    if (fromIndex === null) return;
    const newRanks = [...values.ranks];
    const [moved] = newRanks.splice(fromIndex, 1);
    const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
    newRanks.splice(adjustedTo, 0, moved);
    updateProperty("ranks", newRanks);
    dragIndex.current = null;
    setInsertAt(null);
  };

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        Rank Definitions
      </Typography>
      <SettingSectionContent>
        <Stack spacing={0}>
          {values.ranks?.map((rank, i) => (
            <Box key={i}>
              <Box
                onDragOver={(e) => {
                  e.preventDefault();
                  setInsertAt(i);
                }}
                onDragLeave={() => setInsertAt(null)}
                onDrop={() => handleDrop(i)}
                sx={{ height: 8, display: "flex", alignItems: "center", pl: 3 }}
              >
                <Box
                  sx={{
                    height: 2,
                    width: 460,
                    borderRadius: 1,
                    bgcolor: insertAt === i ? "primary.main" : "transparent",
                    transition: "background-color 0.1s",
                  }}
                />
              </Box>

              <Box
                draggable
                onDragStart={() => {
                  dragIndex.current = i;
                }}
                onDragEnd={() => {
                  dragIndex.current = null;
                  setInsertAt(null);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  opacity: dragIndex.current === i ? 0.35 : 1,
                  transition: "opacity 0.1s",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "grab",
                    color: "text.disabled",
                    "&:active": { cursor: "grabbing" },
                  }}
                >
                  <ReOrderDotsVertical20Regular />
                </Box>
                <TextField
                  size="small"
                  value={rank.name}
                  onChange={(e) => updateRank(i, "name", e.target.value)}
                  placeholder="Name"
                  sx={{ width: 280, ml: 0.5 }}
                  required
                />
                <TextField
                  size="small"
                  value={levelInputs[i] ?? String(rank.min_level)}
                  onChange={(e) => {
                    setLevelInputs((prev) => ({
                      ...prev,
                      [i]: e.target.value,
                    }));
                    const num = Number(e.target.value);
                    if (!isNaN(num)) updateRank(i, "min_level", num);
                  }}
                  onBlur={() => {
                    const raw = levelInputs[i];
                    if (raw !== undefined) {
                      const num = Number(raw);
                      updateRank(i, "min_level", isNaN(num) ? 0 : num);
                      setLevelInputs((prev) => {
                        const next = { ...prev };
                        delete next[i];
                        return next;
                      });
                    }
                  }}
                  placeholder="Min level"
                  sx={{ width: 140 }}
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                      ref: (el: HTMLInputElement | null) => {
                        levelRefs.current[i] = el;
                      },
                    },
                  }}
                  error={isDuplicate(i)}
                  helperText={isDuplicate(i) ? "Duplicate level" : undefined}
                  required
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeRank(i)}
                  sx={{ mt: 0.5 }}
                >
                  <Delete20Regular />
                </IconButton>
              </Box>
            </Box>
          ))}

          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setInsertAt(values.ranks?.length ?? 0);
            }}
            onDragLeave={() => setInsertAt(null)}
            onDrop={() => handleDrop(values.ranks?.length ?? 0)}
            sx={{ height: 8, display: "flex", alignItems: "center", pl: 3 }}
          >
            <Box
              sx={{
                height: 2,
                width: 460,
                borderRadius: 1,
                bgcolor:
                  insertAt === (values.ranks?.length ?? 0)
                    ? "primary.main"
                    : "transparent",
                transition: "background-color 0.1s",
              }}
            />
          </Box>
        </Stack>
        <SecondaryButton
          variant="contained"
          size="small"
          startIcon={<Add24Regular />}
          onClick={addRank}
          sx={{
            alignSelf: "flex-start",
            fontSize: "0.75rem",
            py: 0.5,
            px: 1.5,
          }}
        >
          Add Rank
        </SecondaryButton>
      </SettingSectionContent>
    </SettingSection>
  );
}
