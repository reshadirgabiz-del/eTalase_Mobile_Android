import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatIDR, subscriptionsApi, truncate } from '@/lib/api';
import type { Subscription } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { colors, PLAN_COLORS, radius, spacing, STATUS_COLORS } from '@/constants/theme';

const STATUS_FILTERS = ['', 'active', 'pending', 'expired', 'cancelled'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function SubscriptionRow({
  item,
  onPress,
}: {
  item: Subscription;
  onPress: () => void;
}) {
  const planColor = PLAN_COLORS[item.plan] ?? colors.gray;
  const statusColor = STATUS_COLORS[item.status] ?? colors.gray;
  const expiring = isExpiringSoon(item.expires_at) && item.status === 'active';

  return (
    <TouchableOpacity
      style={[styles.row, item.is_archived && styles.rowArchived]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.rowAccent, { backgroundColor: statusColor }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Badge label={item.plan} color={planColor} size="sm" />
          <View style={styles.rowBadges}>
            <Badge label={item.status} color={statusColor} size="sm" />
            {expiring && <Badge label="exp. soon" color={colors.warning} size="sm" />}
            {item.is_archived && <Badge label="archived" color={colors.gray} size="sm" />}
          </View>
        </View>
        <Text style={styles.rowUserId} numberOfLines={1}>{item.user_id}</Text>
        <Text style={styles.rowDate}>Berakhir: {formatDate(item.expires_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SubscriptionsScreen() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [activateOpen, setActivateOpen] = useState(false);
  const [activateForm, setActivateForm] = useState({ userId: '', plan: 'growth', days: '30' });

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: subscriptionsApi.list,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'expire' | 'cancel' | 'archive' }) =>
      subscriptionsApi.action(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      setSelected(null);
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      subscriptionsApi.confirm(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      setSelected(null);
      setConfirmAmount('');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const activateMutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.activate({
        userId: activateForm.userId,
        plan: activateForm.plan,
        days: parseInt(activateForm.days, 10) || 30,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      setActivateOpen(false);
      setActivateForm({ userId: '', plan: 'growth', days: '30' });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const cancelStaleMutation = useMutation({
    mutationFn: subscriptionsApi.cancelStale,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      Alert.alert('Selesai', `${r.cancelled} langganan dibatalkan`);
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const filtered = data.filter((s) => {
    if (!showArchived && s.is_archived) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    if (search && !s.user_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeFilterLabel = statusFilter || 'Semua';

  const handleAction = (action: 'expire' | 'cancel' | 'archive') => {
    if (!selected) return;
    const labels: Record<string, string> = { expire: 'Expire', cancel: 'Batalkan', archive: 'Arsipkan' };
    Alert.alert(`${labels[action]} langganan?`, 'Tindakan ini tidak dapat dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: labels[action],
        style: 'destructive',
        onPress: () => actionMutation.mutate({ id: selected.id, action }),
      },
    ]);
  };

  const handleConfirmPayment = () => {
    const amount = parseFloat(confirmAmount.replace(/\./g, '').replace(',', '.'));
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }
    confirmMutation.mutate({ id: selected!.id, amount });
  };

  const handleCancelStale = () => {
    Alert.alert(
      'Batalkan Pending Lama?',
      'Ini akan membatalkan semua pending langganan yang lebih dari 24 jam.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Batalkan', style: 'destructive', onPress: () => cancelStaleMutation.mutate() },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Langganan</Text>
          <Text style={styles.subtitle}>{filtered.length} record</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setActivateOpen(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleCancelStale}
            disabled={cancelStaleMutation.isPending}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search + Filter */}
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={15} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari user ID…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: STATUS_COLORS[statusFilter] ?? colors.primary }]} />
            <Text style={styles.filterLabel}>{activeFilterLabel}</Text>
            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.archiveChip, showArchived && styles.archiveChipActive]}
            onPress={() => setShowArchived((v) => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="archive-outline" size={13} color={showArchived ? '#fff' : colors.textSecondary} />
            <Text style={[styles.archiveLabel, showArchived && styles.archiveLabelActive]}>Arsip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <SubscriptionRow
              item={item}
              onPress={() => {
                setSelected(item);
                setConfirmAmount('');
              }}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Tidak ada langganan</Text>
          }
        />
      )}

      {/* Filter modal */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setFilterOpen(false)} activeOpacity={1}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Filter Status</Text>
            {STATUS_FILTERS.map((f) => {
              const selected = statusFilter === f;
              const label = f || 'Semua';
              const color = STATUS_COLORS[f] ?? colors.primary;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.dropdownOption, selected && { backgroundColor: `${color}10` }]}
                  onPress={() => { setStatusFilter(f); setFilterOpen(false); }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.optionDot, { backgroundColor: color }]} />
                  <Text style={[styles.optionLabel, selected && { color, fontWeight: '800' }]}>
                    {label}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={14} color={color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Detail bottom sheet */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetDismiss} onPress={() => setSelected(null)} activeOpacity={1} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {selected && (
                <>
                  <Text style={styles.sheetTitle}>Detail Langganan</Text>

                  {/* Badges */}
                  <View style={styles.badgeRow}>
                    <Badge label={selected.plan} color={PLAN_COLORS[selected.plan] ?? colors.gray} />
                    <Badge label={selected.status} color={STATUS_COLORS[selected.status] ?? colors.gray} />
                    {isExpiringSoon(selected.expires_at) && selected.status === 'active' && (
                      <Badge label="exp. soon" color={colors.warning} />
                    )}
                    {selected.is_archived && <Badge label="archived" color={colors.gray} />}
                  </View>

                  {/* Info rows */}
                  <View style={styles.infoSection}>
                    <InfoRow label="ID" value={truncate(selected.id, 20)} mono />
                    <InfoRow label="User ID" value={truncate(selected.user_id, 28)} mono />
                    <InfoRow label="Berakhir" value={formatDate(selected.expires_at)} />
                    <InfoRow label="Dibuat" value={formatDate(selected.created_at)} />
                    {selected.amount_paid != null && (
                      <InfoRow label="Dibayar" value={formatIDR(selected.amount_paid)} highlight />
                    )}
                    {selected.midtrans_order_id && (
                      <InfoRow label="Order ID" value={selected.midtrans_order_id} mono />
                    )}
                    {selected.payment_proof_submitted_at && (
                      <InfoRow label="Bukti Masuk" value={formatDate(selected.payment_proof_submitted_at)} />
                    )}
                  </View>

                  {/* Confirm payment */}
                  {selected.status === 'pending' && !selected.is_archived && (
                    <View style={styles.confirmSection}>
                      <Text style={styles.confirmTitle}>Konfirmasi Pembayaran Transfer</Text>
                      <Text style={styles.confirmHint}>
                        Verifikasi bukti transfer, lalu masukkan jumlah diterima.
                      </Text>
                      <TextInput
                        style={styles.amountInput}
                        placeholder="Jumlah diterima (IDR)"
                        placeholderTextColor={colors.textMuted}
                        value={confirmAmount}
                        onChangeText={setConfirmAmount}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={handleConfirmPayment}
                        disabled={confirmMutation.isPending}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                        <Text style={styles.confirmBtnText}>
                          {confirmMutation.isPending ? 'Memproses…' : 'Konfirmasi Pembayaran'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Actions */}
                  {!selected.is_archived && (
                    <View style={styles.actionsSection}>
                      <Text style={styles.actionsTitle}>Tindakan</Text>
                      <View style={styles.actionsRow}>
                        {(selected.status === 'active' || selected.status === 'pending') && (
                          <>
                            <TouchableOpacity
                              style={[styles.actionBtn, { borderColor: colors.warning }]}
                              onPress={() => handleAction('expire')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="time-outline" size={14} color={colors.warning} />
                              <Text style={[styles.actionBtnText, { color: colors.warning }]}>Expire</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionBtn, { borderColor: colors.danger }]}
                              onPress={() => handleAction('cancel')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
                              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Cancel</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        {(selected.status === 'cancelled' || isExpiringSoon(selected.expires_at)) && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: colors.gray }]}
                            onPress={() => handleAction('archive')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="archive-outline" size={14} color={colors.gray} />
                            <Text style={[styles.actionBtnText, { color: colors.gray }]}>Archive</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Activate modal */}
      <Modal
        visible={activateOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setActivateOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetDismiss} onPress={() => setActivateOpen(false)} activeOpacity={1} />
          <View style={[styles.sheet, styles.sheetCompact]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Aktifkan Langganan</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Clerk User ID</Text>
              <TextInput
                style={styles.formInput}
                placeholder="user_2abc…"
                placeholderTextColor={colors.textMuted}
                value={activateForm.userId}
                onChangeText={(v) => setActivateForm((f) => ({ ...f, userId: v }))}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Paket</Text>
              <View style={styles.planPicker}>
                {(['starter', 'growth', 'business', 'enterprise'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.planOption, activateForm.plan === p && { backgroundColor: PLAN_COLORS[p] }]}
                    onPress={() => setActivateForm((f) => ({ ...f, plan: p }))}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.planOptionText,
                        activateForm.plan === p && { color: '#fff' },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Durasi (hari)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="30"
                placeholderTextColor={colors.textMuted}
                value={activateForm.days}
                onChangeText={(v) => setActivateForm((f) => ({ ...f, days: v }))}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>
                {activateMutation.isPending ? 'Mengaktifkan…' : 'Aktifkan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, mono, highlight }: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text
        style={[
          infoStyles.value,
          mono && infoStyles.mono,
          highlight && infoStyles.highlight,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    width: 100,
    flexShrink: 0,
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    textAlign: 'right',
  },
  mono: {
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  highlight: {
    color: colors.success,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  archiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  archiveChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  archiveLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  archiveLabelActive: { color: '#fff' },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  rowArchived: { opacity: 0.5 },
  rowAccent: { width: 4 },
  rowBody: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowBadges: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  rowUserId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: spacing.lg,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  optionDot: { width: 9, height: 9, borderRadius: 4.5 },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetDismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  sheetCompact: { maxHeight: '70%' },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  infoSection: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  confirmSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  confirmHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  amountInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  confirmBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: { gap: spacing.xs },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  formInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  planPicker: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  planOption: {
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
