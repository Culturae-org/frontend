"use client";

import { useCallback, useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import { datasetsService } from "../lib/services/datasets.service";
import type {
  CreateDatasetRequest,
  DatasetUpdateInfo,
  ImportDatasetRequest,
  ImportJob,
  ImportStats,
  QuestionDataset,
  UpdateDatasetRequest,
} from "../lib/types/datasets.types";
import type { GeographyDataset } from "../lib/types/geography.types";

export function useDatasets() {
  const [datasets, setDatasets] = useState<QuestionDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async (activeOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await datasetsService.getDatasets(activeOnly);
      setDatasets(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch datasets";
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const createDataset = useCallback(
    async (datasetData: CreateDatasetRequest) => {
      try {
        const newDataset = await datasetsService.createDataset(datasetData);
        setDatasets((prev) => [newDataset, ...prev]);
        enqueueSnackbar("Dataset created successfully", { variant: "success" });
        return newDataset;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create dataset";
        enqueueSnackbar(errorMessage, { variant: "error" });
        throw err;
      }
    },
    [],
  );

  const updateDataset = useCallback(
    async (id: string, updates: UpdateDatasetRequest) => {
      try {
        const updatedDataset = await datasetsService.updateDataset(id, updates);
        setDatasets((prev) =>
          prev.map((d) => (d.id === id ? updatedDataset : d)),
        );
        enqueueSnackbar("Dataset updated successfully", { variant: "success" });
        return updatedDataset;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update dataset";
        enqueueSnackbar(errorMessage, { variant: "error" });
        throw err;
      }
    },
    [],
  );

  const deleteDataset = useCallback(async (id: string) => {
    try {
      await datasetsService.deleteDataset(id);
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      enqueueSnackbar("Dataset deleted successfully", { variant: "success" });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete dataset";
      enqueueSnackbar(errorMessage, { variant: "error" });
      throw err;
    }
  }, []);

  const setDefaultDataset = useCallback(async (id: string) => {
    try {
      await datasetsService.setDefaultDataset(id);
      setDatasets((prev) =>
        prev.map((d) => ({
          ...d,
          is_default: d.id === id,
        })),
      );
      enqueueSnackbar("Default dataset updated successfully", { variant: "success" });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set default dataset";
      enqueueSnackbar(errorMessage, { variant: "error" });
      throw err;
    }
  }, []);

  const checkForUpdates = useCallback(
    async (manifestUrl: string): Promise<DatasetUpdateInfo> => {
      try {
        return await datasetsService.checkForUpdates(manifestUrl);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to check for updates";
        enqueueSnackbar(errorMessage, { variant: "error" });
        throw err;
      }
    },
    [],
  );

  const importDataset = useCallback(
    async (importData: ImportDatasetRequest) => {
      try {
        const result = await datasetsService.importDataset(importData);
        enqueueSnackbar("Dataset imported successfully", { variant: "success" });
        await fetchDatasets();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to import dataset";
        enqueueSnackbar(errorMessage, { variant: "error" });
        throw err;
      }
    },
    [fetchDatasets],
  );

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  return {
    datasets,
    loading,
    error,
    fetchDatasets,
    createDataset,
    updateDataset,
    deleteDataset,
    setDefaultDataset,
    checkForUpdates,
    importDataset,
  };
}

export function useImportJobs() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await datasetsService.getImportJobs();
      setJobs(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch import jobs";
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const getJobLogs = useCallback(
    async (
      id: string,
      params?: { limit?: number; offset?: number; action?: string },
    ) => {
      try {
        return await datasetsService.getImportJobLogs(id, params);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch job logs";
        enqueueSnackbar(errorMessage, { variant: "error" });
        throw err;
      }
    },
    [],
  );

  const getImportStats = useCallback(async (): Promise<ImportStats> => {
    try {
      return await datasetsService.getImportStats();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch import stats";
      enqueueSnackbar(errorMessage, { variant: "error" });
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    getJobLogs,
    getImportStats,
  };
}

export function useGeographyDatasets() {
  const [datasets, setDatasets] = useState<GeographyDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async (activeOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await datasetsService.getGeographyDatasets(activeOnly);
      setDatasets(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch geography datasets";
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  return {
    datasets,
    loading,
    error,
    fetchDatasets,
  };
}
