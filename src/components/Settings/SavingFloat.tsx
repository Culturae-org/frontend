import { LoadingButton } from "@mui/lab";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Save from "@mui/icons-material/Save";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import { styled } from "@mui/material/styles";

const SavingFloatContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(2),
  position: "fixed",
  backgroundColor: theme.palette.background.paper,
  bottom: 23,
  zIndex: theme.zIndex.modal,
}));

export interface SavingFloatProps {
  in: boolean;
  submitting: boolean;
  revert: () => void;
  submit: () => void;
  disabled?: boolean;
}

export default function SavingFloat({
  in: inProp,
  submitting,
  revert,
  submit,
  disabled,
}: SavingFloatProps) {
  return (
    <>
      <Box sx={{ height: 70 }} />
      <Grow in={inProp}>
        <SavingFloatContainer>
          <LoadingButton
            loading={submitting}
            onClick={submit}
            variant="contained"
            startIcon={<Save />}
            disabled={disabled}
          >
            Save
          </LoadingButton>
          <Button
            disabled={submitting}
            onClick={revert}
            sx={{
              ml: 1,
              color: "text.secondary",
              backgroundColor: "action.hover",
              "&:hover": { backgroundColor: "action.focus" },
            }}
            variant="contained"
            startIcon={<ArrowBack />}
          >
            Revert
          </Button>
        </SavingFloatContainer>
      </Grow>
    </>
  );
}
