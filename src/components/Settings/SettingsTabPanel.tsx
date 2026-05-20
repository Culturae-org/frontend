import { apiGet, apiPut } from "@/lib/api-client";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { enqueueSnackbar } from "notistack";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import SavingFloat from "./SavingFloat";

interface SettingsContextValue<T extends Record<string, unknown>> {
  values: T;
  updateProperty: <K extends keyof T>(key: K, value: T[K]) => void;
  setValues: React.Dispatch<React.SetStateAction<T>>;
}

const SettingsContext = createContext<SettingsContextValue<Record<string, unknown>>>({
  values: {},
  updateProperty: () => {},
  setValues: () => {},
});

export function useSettingsContext<T extends Record<string, unknown>>(): SettingsContextValue<T> {
  return useContext(SettingsContext) as SettingsContextValue<T>;
}

interface SettingsTabPanelProps<T extends Record<string, unknown>> {
  endpoint: string;
  defaults: T;
  children: ReactNode;
  readOnly?: boolean;
}

export default function SettingsTabPanel<T extends Record<string, unknown>>({
  endpoint,
  defaults,
  children,
  readOnly,
}: SettingsTabPanelProps<T>) {
  const [values, setValues] = useState<T>(defaults);
  const [originalValues, setOriginalValues] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiGet(endpoint);
        if (!res.ok) return;
        const json = await res.json();
        const data: T = (json.data ?? json) as T;
        if (!cancelled) {
          setValues(data);
          setOriginalValues(data);
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [endpoint]);

  const updateProperty = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(originalValues),
    [values, originalValues],
  );

  const revert = useCallback(() => {
    setValues(originalValues);
  }, [originalValues]);

  const submit = useCallback(async () => {
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPut(endpoint, values);
      if (!res.ok) throw new Error("Failed to save settings");
      const json = await res.json();
      const data: T = (json.data ?? json) as T;
      setValues(data);
      setOriginalValues(data);
      enqueueSnackbar("Configuration updated successfully", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(
        e instanceof Error ? e.message : "Failed to save configuration",
        { variant: "error" },
      );
    } finally {
      setSubmitting(false);
    }
  }, [values, originalValues, endpoint]);

  const contextValue = useMemo(
    () => ({ values, updateProperty, setValues }),
    [values, updateProperty],
  );

  if (loading) {
    return (
      <Stack sx={{ py: 8, alignItems: "center" }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      <Box component="form" ref={formRef} onSubmit={(e) => e.preventDefault()}>
        <Stack spacing={5}>
          {children}
        </Stack>
        {!readOnly && (
          <SavingFloat
            in={dirty}
            submitting={submitting}
            revert={revert}
            submit={submit}
          />
        )}
      </Box>
    </SettingsContext.Provider>
  );
}
