import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  FormControl,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import {
  ArrowLeft20Regular,
  ArrowSync20Regular,
  Delete20Regular,
  Dismiss20Regular,
} from "@fluentui/react-icons";
import { enqueueSnackbar } from "notistack";
import { gamesService } from "@/lib/services/games.service";
import type { GameInvite } from "@/lib/types/games.types";
import { SecondaryButton, SquareChip } from "@/components/Common/StyledComponents";
import { RowActionMenu } from "@/components/Common/RowActionMenu";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import { useConfirm } from "@/components/Common/ConfirmDialog";
import { useDateFormat } from "@/hooks/useDateFormat";

const STATUS_OPTIONS = ["", "pending", "accepted", "rejected", "cancelled", "expired"] as const;
type InviteStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "error" | "secondary"> = {
  pending: "warning",
  accepted: "success",
  rejected: "error",
  cancelled: "default",
  expired: "secondary",
};

function RowSkeleton() {
  return (
    <TableRow sx={{ height: 43 }}>
      {Array.from({ length: 6 }).map((_, i) =>
        i === 5 ? (
          <TableCell key={i} align="right" sx={{ width: 52 }}>
            <Skeleton variant="circular" width={28} height={28} sx={{ ml: "auto" }} />
          </TableCell>
        ) : (
          <TableCell key={i}>
            <Skeleton variant="text" width={60 + (i % 3) * 30} />
          </TableCell>
        )
      )}
    </TableRow>
  );
}

export default function GameInvitesPage() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { formatDateOnly } = useDateFormat();

  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [status, setStatus] = useState<InviteStatus>("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(
    async (p = page, lim = limit, st = status) => {
      setLoading(true);
      try {
        const res = await gamesService.listInvites({ status: st || undefined, page: p, limit: lim });
        setInvites(res.data);
        setTotalCount(res.total_count);
      } catch {
        enqueueSnackbar(t("common.error"), { variant: "error" });
      } finally {
        setLoading(false);
        setBusy(false);
      }
    },
    [page, limit, status, t],
  );

  useEffect(() => {
    load();
  }, [page, limit, status]);

  useEffect(() => {
    return () => clearTimeout(busyTimer.current);
  }, []);

  const handleRefresh = () => {
    setBusy(true);
    load();
  };

  const handleStatusChange = (val: InviteStatus) => {
    setStatus(val);
    setPage(1);
  };

  const handleCancel = async (invite: GameInvite) => {
    const ok = await confirm({
      title: t("invites.actions.cancelTitle"),
      description: t("invites.actions.cancelConfirm"),
      confirmText: t("invites.actions.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await gamesService.cancelInvite(invite.id);
      enqueueSnackbar(t("invites.actions.cancelSuccess"), { variant: "success" });
      load();
    } catch {
      enqueueSnackbar(t("invites.actions.cancelError"), { variant: "error" });
    }
  };

  const handleDelete = async (invite: GameInvite) => {
    const ok = await confirm({
      title: t("invites.actions.deleteTitle"),
      description: t("invites.actions.deleteConfirm"),
      confirmText: t("invites.actions.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await gamesService.deleteInvite(invite.id);
      enqueueSnackbar(t("invites.actions.deleteSuccess"), { variant: "success" });
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      setTotalCount((c) => c - 1);
    } catch {
      enqueueSnackbar(t("invites.actions.deleteError"), { variant: "error" });
    }
  };

  const isAnyLoading = loading || busy;
  const showSkeletons = loading && invites.length === 0;
  const showRefreshSkeletons = (loading || busy) && invites.length > 0;

  return (
    <PageContainer>
      <PageHeader
        title={t("invites.title")}
        subtitle={totalCount > 0 ? t("invites.subtitle", { count: totalCount }) : undefined}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <SecondaryButton
          variant="contained"
          startIcon={<ArrowLeft20Regular />}
          onClick={() => navigate("/games")}
        >
          {t("invites.toolbar.backToGames")}
        </SecondaryButton>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as InviteStatus)}
            displayEmpty
            sx={{ fontSize: "0.875rem" }}
          >
            <MenuItem value="">
              <Typography variant="body2">{t("invites.filter.all")}</Typography>
            </MenuItem>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <MenuItem key={s} value={s}>
                <Typography variant="body2">{t(`invites.status.${s}`)}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <SecondaryButton
          variant="contained"
          startIcon={<ArrowSync20Regular />}
          onClick={handleRefresh}
          disabled={isAnyLoading}
        >
          {t("invites.toolbar.refresh")}
        </SecondaryButton>
      </Stack>

      <TableContainer
        component={Paper}
        sx={{ boxShadow: "none", border: 1, borderColor: "divider", overflowX: "auto", position: "relative" }}
      >
        {isAnyLoading && (
          <LinearProgress
            sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, borderRadius: "4px 4px 0 0", height: 2 }}
          />
        )}
        <Table size="small" stickyHeader sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120, whiteSpace: "nowrap" }}>{t("invites.columns.from")}</TableCell>
              <TableCell sx={{ minWidth: 120, whiteSpace: "nowrap" }}>{t("invites.columns.to")}</TableCell>
              <TableCell sx={{ minWidth: 100, whiteSpace: "nowrap" }}>{t("invites.columns.game")}</TableCell>
              <TableCell sx={{ minWidth: 100, whiteSpace: "nowrap" }}>{t("invites.columns.status")}</TableCell>
              <TableCell sx={{ minWidth: 100, whiteSpace: "nowrap" }}>{t("invites.columns.createdAt")}</TableCell>
              <TableCell sx={{ minWidth: 52 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {showSkeletons ? (
              Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={`skel-${i}`} />)
            ) : showRefreshSkeletons ? (
              invites.map((_, i) => <RowSkeleton key={`ref-${i}`} />)
            ) : invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("invites.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => {
                const isPending = invite.status === "pending";
                return (
                  <TableRow key={invite.id} hover sx={{ height: 43 }}>
                    <TableCell sx={{ fontSize: "0.875rem" }}>
                      {invite.from_user?.username ?? invite.from_user_public_id ?? "—"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.875rem" }}>
                      {invite.to_user?.username ?? invite.to_user_public_id ?? "—"}
                    </TableCell>
                    <TableCell>
                      {invite.game ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <SquareChip
                            label={t(`games.mode.${invite.game.mode}`, { defaultValue: invite.game.mode })}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.75rem" }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontFamily: "monospace", fontSize: "0.78rem", cursor: "pointer", "&:hover": { color: "primary.main" } }}
                            onClick={() => navigate(`/games/${invite.game_id}`)}
                          >
                            {(invite.game.public_id ?? invite.game_id).substring(0, 8)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                          {invite.game_id.substring(0, 8)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <SquareChip
                        label={t(`invites.status.${invite.status}`, { defaultValue: invite.status })}
                        size="small"
                        color={STATUS_COLORS[invite.status] ?? "default"}
                        sx={{ height: 20, fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                      {formatDateOnly(invite.created_at)}
                    </TableCell>
                    <TableCell align="right">
                      <RowActionMenu
                        actions={[
                          ...(isPending ? [{
                            label: t("invites.actions.cancel"),
                            icon: <Dismiss20Regular />,
                            onClick: () => handleCancel(invite),
                          }] : []),
                          {
                            label: t("invites.actions.delete"),
                            icon: <Delete20Regular />,
                            onClick: () => handleDelete(invite),
                            danger: true,
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalCount > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page - 1}
          rowsPerPage={limit}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, p) => setPage(p + 1)}
          onRowsPerPageChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          labelRowsPerPage={t("users.table.rowsPerPage")}
          sx={{ mt: 1 }}
        />
      )}
    </PageContainer>
  );
}
