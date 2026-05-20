export type PodStatus = "healthy" | "degraded" | "offline";
export type PodType = "main" | "headless";

export interface PodInfo {
  pod_id: string;
  pod_type: PodType;
  status: PodStatus;
  is_current: boolean;
  connected_clients: number;
  online_users: number;
  active_games: number;
  last_heartbeat: string;
  started_at: string;
}

export interface PodsMeta {
  total_pods: number;
  main_pods: number;
  headless_pods: number;
  total_clients: number;
  total_users: number;
}

export interface PodsResponse {
  pods: PodInfo[];
  meta: PodsMeta;
}
