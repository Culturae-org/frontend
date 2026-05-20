import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolveRef = useRef<((val: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((res) => {
      setOptions(opts);
      setOpen(true);
      resolveRef.current = res;
    });
  }, []);

  const handleClose = (result: boolean) => {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onClose={() => handleClose(false)}
        maxWidth="xs"
        fullWidth
      >
        {options.title && <DialogTitle>{options.title}</DialogTitle>}
        {options.description && (
          <DialogContent>
            <DialogContentText>{options.description}</DialogContentText>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => handleClose(false)} size="small">
            {options.cancelText ?? t("cancel")}
          </Button>
          <Button
            onClick={() => handleClose(true)}
            color={options.danger ? "error" : "primary"}
            variant="contained"
            size="small"
          >
            {options.confirmText ?? t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
