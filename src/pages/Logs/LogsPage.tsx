import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Box } from "@mui/material";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import ResponsiveTabs, { type TabConfig } from "@/components/Common/ResponsiveTabs";
import AdminLogsTab from "./AdminLogsTab";
import UserLogsTab from "./UserLogsTab";

const TAB_PARAM: Record<string, number> = { admin: 0, users: 1 };
const TAB_VALUE: Record<number, string> = { 0: "admin", 1: "users" };

export default function LogsPage() {
  const { t } = useTranslation("dashboard");
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = TAB_PARAM[searchParams.get("actions") ?? "admin"] ?? 0;

  const setTab = (_: unknown, v: number) => {
    setSearchParams({ actions: TAB_VALUE[v] ?? "admin" }, { replace: true });
  };

  const tabs: TabConfig<number>[] = useMemo(() => [
    { label: t("logs.tabs.admin"), value: 0 },
    { label: t("logs.tabs.users"), value: 1 },
  ], [t]);

  return (
    <PageContainer>
      <PageHeader title={t("nav.logs")} />

      <ResponsiveTabs tabs={tabs} value={tab} onChange={setTab} />

      <Box role="tabpanel" hidden={tab !== 0}>
        {tab === 0 && <AdminLogsTab />}
      </Box>
      <Box role="tabpanel" hidden={tab !== 1}>
        {tab === 1 && <UserLogsTab />}
      </Box>
    </PageContainer>
  );
}
