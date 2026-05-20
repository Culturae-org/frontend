import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { GAMES_ENDPOINTS } from "@/lib/api/endpoints";
import type { AdminGame } from "@/lib/types/games.types";

export function useRecentGames(hours: number) {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (hours <= 0) return;
    setLoading(true);
    try {
      const res = await apiGet(`${GAMES_ENDPOINTS.LIST}?limit=500`);
      if (!res.ok) return;
      const body = await res.json();
      const all: AdminGame[] = body.data?.items ?? body.items ?? body.data ?? [];
      const cutoff = Date.now() - hours * 3_600_000;
      setGames(all.filter((g) => new Date(g.created_at).getTime() >= cutoff));
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { games, loading, refresh: fetch };
}
