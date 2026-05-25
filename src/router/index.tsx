import NotFound from "@/pages/NotFound";
import RequireAuth from "@/components/Common/RequireAuth";
import type { ComponentType } from "react";
import type { RouteObject } from "react-router";

function lazy(factory: () => Promise<{ default: ComponentType }>) {
  return async () => {
    const mod = await factory();
    return { Component: mod.default };
  };
}

const protectedPages: RouteObject[] = [
  { index: true, lazy: lazy(() => import("@/pages/Dashboard")) },
  { path: "users", lazy: lazy(() => import("@/pages/Users/UsersPage")) },
  { path: "users/:id", lazy: lazy(() => import("@/pages/Users/UserDetailPage")) },
  { path: "analytics", lazy: lazy(() => import("@/pages/Analytics/AnalyticsPage")) },
  { path: "settings", lazy: lazy(() => import("@/pages/Settings/SettingsPage")) },
  { path: "pods", lazy: lazy(() => import("@/pages/Pods/PodsPage")) },
  { path: "templates", lazy: lazy(() => import("@/pages/Templates/TemplatesPage")) },
  { path: "templates/new", lazy: lazy(() => import("@/pages/Templates/TemplateCreatePage")) },
  { path: "templates/:id", lazy: lazy(() => import("@/pages/Templates/TemplateEditPage")) },
  { path: "datasets", lazy: lazy(() => import("@/pages/Datasets/DatasetsPage")) },
  { path: "datasets/new", lazy: lazy(() => import("@/pages/Datasets/DatasetCreatePage")) },
  { path: "datasets/:id", lazy: lazy(() => import("@/pages/Datasets/DatasetEditPage")) },
  { path: "geography", lazy: lazy(() => import("@/pages/Geography/GeographyPage")) },
  { path: "questions", lazy: lazy(() => import("@/pages/Questions/QuestionsPage")) },
  { path: "questions/new", lazy: lazy(() => import("@/pages/Questions/QuestionCreatePage")) },
  { path: "questions/:id", lazy: lazy(() => import("@/pages/Questions/QuestionEditPage")) },
  { path: "reports", lazy: lazy(() => import("@/pages/Reports/ReportsPage")) },
  { path: "games", lazy: lazy(() => import("@/pages/Games/GamesPage")) },
  { path: "games/:id", lazy: lazy(() => import("@/pages/Games/GameDetailPage")) },
  { path: "logs", lazy: lazy(() => import("@/pages/Logs/LogsPage")) },
  { path: "api-explorer", lazy: lazy(() => import("@/pages/ApiExplorer/ApiExplorerPage")) },
  { path: "*", element: <NotFound /> },
];

export const routes: RouteObject[] = [
  {
    lazy: lazy(() => import("@/layouts/HeadlessFrame")),
    children: [
      { path: "/login", lazy: lazy(() => import("@/pages/Login")) },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        lazy: lazy(() => import("@/layouts/NavBarFrame")),
        children: protectedPages,
      },
    ],
  },
];
