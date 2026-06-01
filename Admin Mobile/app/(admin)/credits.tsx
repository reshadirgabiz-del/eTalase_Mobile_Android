import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { creditsApi, formatDate, formatIDR, truncate } from '@/lib/api';
import type { CreditBalance, CreditTransaction, RefundRequest, TopupRequest } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { colors, radius, spacing } from '@/constants/theme';

type Tab = 'topups' | 'refunds' | 'balances' | 'transactions';

const TX_TYPE_COLOR: Record<string, string> = {
  topup: colors.success,
  deduction: colors.danger,
  refund: colors.info,
};

const TX_TYPE_LABEL: Record<string, string> = {
  topup: 'Topup',
  deduction: 'Deduction',
  refund: 'Refund',
};

export default function CreditsScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('topups');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['credits'],
    queryFn: creditsApi.list,
  });

  const { data: balancesData, isLoading: balancesLoading, refetch: refetchBalances, isRefetching: refetchingBalances } = useQuery({
    queryKey: ['credits-balances'],
    queryFn: creditsApi.listBalances,
    enabled: tab === 'balances',
  });

  const { data: txData, isLoading: txLoading, refetch: refetchTx, isRefetching: refetchingTx } = useQuery({
    queryKey: ['credits-transactions'],
    queryFn: creditsApi.listTransactions,
    enabled: tab === 'transactions',
  });

  const topups = data?.topups ?? [];
  const refunds = data?.refunds ?? [];
  const balances = balancesData?.balances ?? [];
  const transactions = txData?.transactions ?? [];

  const confirmTopupMutation = useMutation({
    mutationFn: creditsApi.confirmTopup,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['credits'] });
      qc.invalidateQueries({ queryKey: ['credits-balances'] });
      qc.invalidateQueries({ queryKey: ['credits-transactions'] });
      Alert.alert('Berhasil', `Topup dikonfirmasi. Saldo baru: ${formatIDR(r.newBalance)}`);
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      creditsApi.handleRefund(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits'] });
      qc.invalidateQueries({ queryKey: ['credits-balances'] });
      qc.invalidateQueries({ queryKey: ['credits-transactions'] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleConfirmTopup = (t: TopupRequest) => {
    Alert.alert(
      'Konfirmasi Topup?',
      `Tambahkan ${formatIDR(t.amount_idr)} ke akun pengguna ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Konfirmasi',
          onPress: () => confirmTopupMutation.mutate(t.id),
        },
      ],
    );
  };

  const handleRefund = (r: RefundRequest, action: 'approve' | 'reject') => {
    const label = action === 'approve' ? 'Setujui' : 'Tolak';
    Alert.alert(
      `${label} Refund?`,
      action === 'approve'
        ? `Kurangi ${formatIDR(r.amount_idr)} dari saldo pengguna.`
        : 'Tandai permintaan sebagai ditolak.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: label,
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: () => refundMutation.mutate({ id: r.id, action }),
        },
      ],
    );
  };

  const handleRefreshCurrent = () => {
    if (tab === 'topups' || tab === 'refunds') refetch();
    else if (tab === 'balances') refetchBalances();
    else refetchTx();
  };

  const isCurrentRefreshing =
    tab === 'topups' || tab === 'refunds'
      ? isRefetching
      : tab === 'balances'
      ? refetchingBalances
      : refetchingTx;

  const isCurrentLoading =
    tab === 'topups' || tab === 'refunds'
      ? isLoading
      : tab === 'balances'
      ? balancesLoading
      : txLoading;

  const TABS: { key: Tab; label: string; badge?: number; badgeColor?: string }[] = [
    { key: 'topups',       label: 'Topup',    badge: topups.length || undefined,  badgeColor: colors.warning },
    { key: 'refunds',      label: 'Refund',   badge: refunds.length || undefined, badgeColor: colors.danger },
    { key: 'balances',     label: 'Saldo' },
    { key: 'transactions', label: 'Riwayat' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isCurrentRefreshing}
            onRefresh={handleRefreshCurrent}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>Kredit</Text>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
              {t.badge != null && (
                <View style={[styles.tabBadge, { backgroundColor: t.badgeColor ?? colors.warning }]}>
                  <Text style={styles.tabBadgeText}>{t.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {isCurrentLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : tab === 'topups' ? (
          <TopupsPanel
            topups={topups}
            isPending={confirmTopupMutation.isPending}
            onConfirm={handleConfirmTopup}
          />
        ) : tab === 'refunds' ? (
          <RefundsPanel
            refunds={refunds}
            isPending={refundMutation.isPending}
            onRefund={handleRefund}
          />
        ) : tab === 'balances' ? (
          <BalancesPanel balances={balances} />
        ) : (
          <TransactionsPanel transactions={transactions} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Topups Panel ────────────────────────────────────────────────────────────

function TopupsPanel({
  topups,
  isPending,
  onConfirm,
}: {
  topups: TopupRequest[];
  isPending: boolean;
  onConfirm: (t: TopupRequest) => void;
}) {
  if (topups.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="checkmark-circle-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyText}>Tidak ada pending topup</Text>
      </View>
    );
  }
  return (
    <View style={styles.cardList}>
      {topups.map((t) => (
        <View key={t.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.amount}>{formatIDR(t.amount_idr)}</Text>
            <Text style={styles.dateText}>{formatDate(t.created_at)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>User ID</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{truncate(t.user_id, 24)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Kode Unik</Text>
            <Badge label={t.unique_code} color={colors.warning} size="sm" />
          </View>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => onConfirm(t)}
            disabled={isPending}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-outline" size={14} color="#fff" />
            <Text style={styles.confirmBtnText}>Konfirmasi Topup</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ─── Refunds Panel ───────────────────────────────────────────────────────────

function RefundsPanel({
  refunds,
  isPending,
  onRefund,
}: {
  refunds: RefundRequest[];
  isPending: boolean;
  onRefund: (r: RefundRequest, action: 'approve' | 'reject') => void;
}) {
  if (refunds.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="checkmark-circle-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyText}>Tidak ada pending refund</Text>
      </View>
    );
  }
  return (
    <View style={styles.cardList}>
      {refunds.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.amount}>{formatIDR(r.amount_idr)}</Text>
            <Text style={styles.dateText}>{formatDate(r.created_at)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>User ID</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{truncate(r.user_id, 24)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Bank</Text>
            <Text style={styles.cardValue}>{r.bank_name}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>No. Rekening</Text>
            <Text style={styles.cardValue}>{r.bank_account_number}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Nama</Text>
            <Text style={styles.cardValue}>{r.bank_account_name}</Text>
          </View>
          {r.message && (
            <Text style={styles.refundMessage}>"{r.message}"</Text>
          )}
          <View style={styles.refundActions}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => onRefund(r, 'approve')}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.approveBtnText}>Setujui</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => onRefund(r, 'reject')}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectBtnText}>Tolak</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Balances Panel ──────────────────────────────────────────────────────────

function BalancesPanel({ balances }: { balances: CreditBalance[] }) {
  if (balances.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="wallet-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyText}>Belum ada data saldo</Text>
      </View>
    );
  }
  return (
    <View style={styles.cardList}>
      {balances.map((b) => (
        <View key={b.user_id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.amount, b.balance_idr <= 0 && styles.amountZero]}>
              {formatIDR(b.balance_idr)}
            </Text>
            <Text style={styles.dateText}>Diperbarui: {formatDate(b.updated_at)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>User ID</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{truncate(b.user_id, 28)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Transactions Panel ──────────────────────────────────────────────────────

function TransactionsPanel({ transactions }: { transactions: CreditTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="list-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
      </View>
    );
  }
  return (
    <View style={styles.cardList}>
      {transactions.map((tx) => {
        const isPositive = tx.amount_idr > 0;
        const typeColor = TX_TYPE_COLOR[tx.type] ?? colors.textMuted;
        return (
          <View key={tx.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.amount, !isPositive && styles.amountNeg]}>
                {isPositive ? '+' : ''}{formatIDR(tx.amount_idr)}
              </Text>
              <Badge
                label={TX_TYPE_LABEL[tx.type] ?? tx.type}
                color={typeColor}
                size="sm"
              />
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>User ID</Text>
              <Text style={styles.cardValue} numberOfLines={1}>{truncate(tx.user_id, 24)}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Deskripsi</Text>
              <Text style={[styles.cardValue, styles.descValue]} numberOfLines={2}>
                {tx.description}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(tx.created_at)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  center: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  cardList: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.success,
  },
  amountZero: {
    color: colors.textMuted,
  },
  amountNeg: {
    color: colors.danger,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textMuted,
    width: 90,
    flexShrink: 0,
  },
  cardValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  descValue: {
    fontFamily: undefined,
    textAlign: 'right',
  },
  confirmBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  confirmBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  refundMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  refundActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.info,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  rejectBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectBtnText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
});
