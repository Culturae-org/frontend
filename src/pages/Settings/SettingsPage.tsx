import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import ResponsiveTabs, { type TabConfig } from "@/components/Common/ResponsiveTabs";
import { SettingsTabPanel } from "@/components/Settings";
import ThemeTab from "@/components/Settings/tabs/ThemeTab";
import PreferencesTab from "@/components/Settings/tabs/PreferencesTab";
import { SETTINGS_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AuthConfig,
  AvatarConfig,
  CountdownConfig,
  ELOConfig,
  GameConfig,
  MaintenanceStatus,
  RateLimitConfig,
  SystemConfig,
  VersionStatus,
  WebSocketConfig,
  XPConfig,
} from "@/lib/types/settings.types";
import { useMemo, useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "react-router";

import SystemTab from "@/components/Settings/tabs/SystemTab";
import AuthTab from "@/components/Settings/tabs/AuthTab";
import XPConfigTab from "@/components/Settings/tabs/XPConfigTab";
import ELOConfigTab from "@/components/Settings/tabs/ELOConfigTab";
import GamesTab from "@/components/Settings/tabs/GamesTab";
import CountdownTab from "@/components/Settings/tabs/CountdownTab";
import RateLimitTab from "@/components/Settings/tabs/RateLimitTab";
import WebSocketTab from "@/components/Settings/tabs/WebSocketTab";
import AvatarTab from "@/components/Settings/tabs/AvatarTab";
import MaintenanceTab from "@/components/Settings/tabs/MaintenanceTab";
import VersionTab from "@/components/Settings/tabs/VersionTab";
import RanksTab from "@/components/Settings/tabs/RanksTab";

enum SettingsTab {
  System = 0,
  Theme = 1,
  Preferences = 2,
  Auth = 3,
  XP = 4,
  Ranks = 5,
  ELO = 6,
  Games = 7,
  Countdown = 8,
  RateLimit = 9,
  WebSocket = 10,
  Avatar = 11,
  Maintenance = 12,
  Version = 13,
}

const SYSTEM_DEFAULTS: SystemConfig = {
  user_cache_ttl_minutes: 1440,
  cleanup_interval_minutes: 5,
  offline_delay_seconds: 2,
  game_leave_delay_seconds: 30,
  analytics_active_days: 1,
  analytics_archive_days: 30,
  dataset_check_enabled: true,
  dataset_check_cron: "0 * * * *",
  version_check_enabled: true,
  session_cleanup_enabled: true,
  session_cleanup_cron: "0 * * * *",
  game_cleanup_enabled: true,
  game_cleanup_cron: "*/5 * * * *",
};

const AUTH_DEFAULTS: AuthConfig = {
  access_token_ttl_minutes: 15,
  refresh_token_ttl_days: 7,
  session_ttl_days: 30,
  max_concurrent_sessions: 5,
  failed_login_attempts: 5,
  login_lockout_minutes: 15,
};

const XP_DEFAULTS: XPConfig = {
  base_xp: 2000,
  growth_rate: 1.5,
  solo_multiplier: 0.5,
  onevone_multiplier: 1.0,
  multi_multiplier: 1.0,
  winner_bonus: 100,
  ranks: [
    { name: "Beginner", min_level: 0 },
    { name: "Intermediate", min_level: 5 },
    { name: "Expert", min_level: 15 },
    { name: "Master", min_level: 30 },
  ],
};

const ELO_DEFAULTS: ELOConfig = {
  k_factor_low_games: 32,
  k_factor_high_games: 16,
  k_factor_threshold: 30,
  min_rating: 0,
  max_rating: 9999,
};

const GAMES_DEFAULTS: GameConfig = {
  active_ttl_minutes: 1440,
  finished_ttl_minutes: 120,
};

const COUNTDOWN_DEFAULTS: CountdownConfig = {
  pre_game_countdown_seconds: 5,
  reconnect_grace_period_seconds: 30,
};

const RATE_LIMIT_DEFAULTS: RateLimitConfig = {
  enabled: true,
  apply_to_admin: false,
  max_requests: 60,
  window_seconds: 60,
};

const WEBSOCKET_DEFAULTS: WebSocketConfig = {
  write_wait_seconds: 10,
  pong_wait_seconds: 60,
  max_message_size_kb: 512,
  allowed_origins: [],
  reconnect_grace_period_seconds: 30,
  message_rate_limit: 100,
  message_rate_window_seconds: 60,
};

const AVATAR_DEFAULTS: AvatarConfig = {
  max_file_size_mb: 5,
  allowed_mime_types: ["image/jpeg", "image/png"],
  allowed_extensions: [".png", ".jpeg", ".jpg"],
};

const MAINTENANCE_DEFAULTS: MaintenanceStatus = {
  enabled: false,
};

const VERSION_DEFAULTS: VersionStatus = {
  current_version: "",
  latest_version: "",
  is_up_to_date: true,
  checked_at: null,
};

interface ApiTabConfig {
  endpoint: string;
  defaults: Record<string, unknown>;
  component: React.FC;
  readOnly?: boolean;
}

const API_TAB_CONFIGS: (ApiTabConfig | null)[] = [
  { endpoint: SETTINGS_ENDPOINTS.SYSTEM_CONFIG, defaults: SYSTEM_DEFAULTS, component: SystemTab },
  null,
  null,
  { endpoint: SETTINGS_ENDPOINTS.AUTH_CONFIG, defaults: AUTH_DEFAULTS, component: AuthTab },
  { endpoint: SETTINGS_ENDPOINTS.XP_CONFIG, defaults: XP_DEFAULTS, component: XPConfigTab },
  { endpoint: SETTINGS_ENDPOINTS.XP_CONFIG, defaults: XP_DEFAULTS, component: RanksTab },
  { endpoint: SETTINGS_ENDPOINTS.ELO_CONFIG, defaults: ELO_DEFAULTS, component: ELOConfigTab },
  { endpoint: SETTINGS_ENDPOINTS.GAME_CONFIG, defaults: GAMES_DEFAULTS, component: GamesTab },
  { endpoint: SETTINGS_ENDPOINTS.GAME_COUNTDOWN_CONFIG, defaults: COUNTDOWN_DEFAULTS, component: CountdownTab },
  { endpoint: SETTINGS_ENDPOINTS.RATE_LIMIT, defaults: RATE_LIMIT_DEFAULTS, component: RateLimitTab },
  { endpoint: SETTINGS_ENDPOINTS.WEBSOCKET, defaults: WEBSOCKET_DEFAULTS, component: WebSocketTab },
  { endpoint: SETTINGS_ENDPOINTS.AVATAR, defaults: AVATAR_DEFAULTS, component: AvatarTab },
  { endpoint: SETTINGS_ENDPOINTS.MAINTENANCE, defaults: MAINTENANCE_DEFAULTS, component: MaintenanceTab },
  { endpoint: SETTINGS_ENDPOINTS.VERSION_STATUS, defaults: VERSION_DEFAULTS, component: VersionTab, readOnly: true },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const getTabFromParam = (param: string | null): SettingsTab => {
    if (!param) return SettingsTab.System;
    const tabMap: Record<string, SettingsTab> = {
      system: SettingsTab.System,
      theme: SettingsTab.Theme,
      preferences: SettingsTab.Preferences,
      auth: SettingsTab.Auth,
      xp: SettingsTab.XP,
      ranks: SettingsTab.Ranks,
      elo: SettingsTab.ELO,
      games: SettingsTab.Games,
      countdown: SettingsTab.Countdown,
      ratelimit: SettingsTab.RateLimit,
      websocket: SettingsTab.WebSocket,
      avatar: SettingsTab.Avatar,
      maintenance: SettingsTab.Maintenance,
      version: SettingsTab.Version,
    };
    return tabMap[param.toLowerCase()] ?? SettingsTab.System;
  };

  const getParamFromTab = (tab: SettingsTab): string => {
    const paramMap: Record<SettingsTab, string> = {
      [SettingsTab.System]: "system",
      [SettingsTab.Theme]: "theme",
      [SettingsTab.Preferences]: "preferences",
      [SettingsTab.Auth]: "auth",
      [SettingsTab.XP]: "xp",
      [SettingsTab.Ranks]: "ranks",
      [SettingsTab.ELO]: "elo",
      [SettingsTab.Games]: "games",
      [SettingsTab.Countdown]: "countdown",
      [SettingsTab.RateLimit]: "ratelimit",
      [SettingsTab.WebSocket]: "websocket",
      [SettingsTab.Avatar]: "avatar",
      [SettingsTab.Maintenance]: "maintenance",
      [SettingsTab.Version]: "version",
    };
    return paramMap[tab];
  };

  const [tab, setTabState] = useState<SettingsTab>(() => getTabFromParam(tabParam));
  const [visitedTabs, setVisitedTabs] = useState<Set<SettingsTab>>(() => new Set([tab]));

  useEffect(() => {
    const newTab = getTabFromParam(tabParam);
    setTabState(newTab);
    setVisitedTabs((prev) => new Set(prev).add(newTab));
  }, [tabParam]);

  const tabs: TabConfig<SettingsTab>[] = useMemo(() => [
    { label: "System", value: SettingsTab.System },
    { label: "Theme", value: SettingsTab.Theme },
    { label: "Preferences", value: SettingsTab.Preferences },
    { label: "Auth", value: SettingsTab.Auth },
    { label: "XP", value: SettingsTab.XP },
    { label: "Ranks", value: SettingsTab.Ranks },
    { label: "ELO", value: SettingsTab.ELO },
    { label: "Games", value: SettingsTab.Games },
    { label: "Countdown", value: SettingsTab.Countdown },
    { label: "Rate Limit", value: SettingsTab.RateLimit },
    { label: "WebSocket", value: SettingsTab.WebSocket },
    { label: "Avatar", value: SettingsTab.Avatar },
    { label: "Maintenance", value: SettingsTab.Maintenance },
    { label: "Version", value: SettingsTab.Version },
  ], []);

  const handleTabChange = (_: React.SyntheticEvent, newIndex: SettingsTab) => {
    flushSync(() => {
      setTabState(newIndex);
      setVisitedTabs((prev) => new Set(prev).add(newIndex));
    });
    setSearchParams({ tab: getParamFromTab(newIndex) }, { replace: true });
  };

  const config = API_TAB_CONFIGS[tab];

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Configure system settings" />
      <ResponsiveTabs
        tabs={tabs}
        value={tab}
        onChange={handleTabChange}
      />

      {!visitedTabs.has(tab) ? null : tab === SettingsTab.Theme ? (
        <ThemeTab />
      ) : tab === SettingsTab.Preferences ? (
        <PreferencesTab />
      ) : config ? (
        <SettingsTabPanel
          key={config.endpoint}
          endpoint={config.endpoint}
          defaults={config.defaults as typeof config.defaults & Record<string, unknown>}
          readOnly={config.readOnly}
        >
          <config.component />
        </SettingsTabPanel>
      ) : null}
    </PageContainer>
  );
}
