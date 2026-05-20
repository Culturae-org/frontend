"use client";

import gameTemplatesService from "@/lib/services/game-templates.service";
import type {
  CreateGameTemplateRequest,
  GameTemplate,
  GameTemplatesQueryParams,
  UpdateGameTemplateRequest,
} from "@/lib/types/game-template.types";
import { useCallback, useState } from "react";
import { enqueueSnackbar } from "notistack";

export function useGameTemplates() {
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(10);
  const fetchTemplates = useCallback(
    async (params: GameTemplatesQueryParams = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await gameTemplatesService.getTemplates(params);
        setTemplates(res.data);
        setTotal(res.total);
        setCurrentPage(res.page);
        setTotalPages(res.total_pages);
        setCurrentLimit(res.limit);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load game templates";
        setError(msg);
        enqueueSnackbar(msg, { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createTemplate = useCallback(
    async (data: CreateGameTemplateRequest): Promise<GameTemplate | null> => {
      try {
        const created = await gameTemplatesService.createTemplate(data);
        setTemplates((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
        enqueueSnackbar(`Template "${created.name}" created`, { variant: "success" });
        return created;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to create template";
        enqueueSnackbar(msg, { variant: "error" });
        return null;
      }
    },
    [],
  );

  const updateTemplate = useCallback(
    async (
      id: string,
      data: UpdateGameTemplateRequest,
    ): Promise<GameTemplate | null> => {
      try {
        const updated = await gameTemplatesService.updateTemplate(id, data);
        setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
        enqueueSnackbar(`Template "${updated.name}" updated`, { variant: "success" });
        return updated;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to update template";
        enqueueSnackbar(msg, { variant: "error" });
        return null;
      }
    },
    [],
  );

  const deleteTemplate = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      try {
        await gameTemplatesService.deleteTemplate(id);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setTotal((prev) => prev - 1);
        enqueueSnackbar(`Template "${name}" deleted`, { variant: "success" });
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to delete template";
        enqueueSnackbar(msg, { variant: "error" });
        return false;
      }
    },
    [],
  );

  const seedDefaultTemplates = useCallback(
    async (onDone?: () => void): Promise<void> => {
      try {
        const res = await gameTemplatesService.seedDefaultTemplates();
        if (res.created === 0) {
          enqueueSnackbar("All default modes already exist", { variant: "info" });
        } else {
          enqueueSnackbar(`${res.created} default mode${res.created !== 1 ? "s" : ""} added`, { variant: "success" });
        }
        onDone?.();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to seed default templates";
        enqueueSnackbar(msg, { variant: "error" });
      }
    },
    [],
  );

  return {
    templates,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    currentLimit,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    seedDefaultTemplates,
  };
}
