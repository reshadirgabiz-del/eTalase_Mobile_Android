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
import { formatDate, formatIDR, vouchersApi } from '@/lib/api';
import type { Plan, PlanVoucher } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { colors, PLAN_COLORS, radius, spacing } from '@/constants/theme';

const PLANS: Plan[] = ['free', 'starter', 'growth', 'business', 'enterprise'];
const BILLING_CYCLES = ['monthly', 'annual'] as const;

export default function VouchersScreen() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percent' as 'percent' | 'absolute',
    value: '10',
    maxUsages: '',
    expires: '',
    applicablePlan: null as Plan | null,
    applicableBillingCycle: null as 'monthly' | 'annual' | null,
  });

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vouchers'],
    queryFn: vouchersApi.list,
  });

  const toggleMutation = useMutation({
    mutationFn: vouchersApi.toggle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: vouchersApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      vouchersApi.create({
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        maxUsages: form.maxUsages ? parseInt(form.maxUsages, 10) : undefined,
        expires: form.expires || undefined,
        applicablePlan: form.applicablePlan,
        applicableBillingCycle: form.applicableBillingCycle,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] });
      setCreateOpen(false);
      setForm({ code: '', type: 'percent', value: '10', maxUsages: '', expires: '', applicablePlan: null, applicableBillingCycle: null });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleDelete = (v: PlanVoucher) => {
    Alert.alert(`Hapus voucher "${v.code}"?`, 'Tidak dapat dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(v.code),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Voucher</Text>
          <Text style={styles.subtitle}>{data.length} voucher</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateOpen(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Buat</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Belum ada voucher</Text>
          }
          renderItem={({ item: v }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.code}>{v.code}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: v.is_active ? `${colors.warning}15` : `${colors.success}15` }]}
                    onPress={() => toggleMutation.mutate(v.code)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="power"
                      size={16}
                      color={v.is_active ? colors.warning : colors.success}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: `${colors.danger}15` }]}
                    onPress={() => handleDelete(v)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardMeta}>
                <Badge
                  label={v.discount_type === 'percent' ? `${v.discount_value}%` : formatIDR(v.discount_value)}
                  color={colors.cyan}
                  size="sm"
                />
                {v.applicable_plan ? (
                  <Badge label={v.applicable_plan} color={PLAN_COLORS[v.applicable_plan] ?? colors.gray} size="sm" />
                ) : (
                  <Badge label="Semua paket" color={colors.gray} size="sm" />
                )}
                {v.applicable_billing_cycle ? (
                  <Badge label={v.applicable_billing_cycle === 'monthly' ? 'Bulanan' : 'Tahunan'} color={colors.cyan} size="sm" />
                ) : null}
                <Badge
                  label={v.is_active ? 'Aktif' : 'Nonaktif'}
                  color={v.is_active ? colors.success : colors.danger}
                  size="sm"
                />
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.infoText}>
                  Digunakan: {v.current_usages}/{v.max_usages ?? '∞'}
                </Text>
                {v.expires_at && (
                  <Text style={styles.infoText}>Berakhir: {formatDate(v.expires_at)}</Text>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* Create voucher modal */}
      <Modal
        visible={createOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetDismiss} onPress={() => setCreateOpen(false)} activeOpacity={1} />
          <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Buat Voucher</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Kode *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="WELCOME20"
                placeholderTextColor={colors.textMuted}
                value={form.code}
                onChangeText={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tipe Diskon</Text>
              <View style={styles.typePicker}>
                {(['percent', 'absolute'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, form.type === t && styles.typeOptionActive]}
                    onPress={() => setForm((f) => ({ ...f, type: t }))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeOptionText, form.type === t && styles.typeOptionTextActive]}>
                      {t === 'percent' ? 'Persentase (%)' : 'Nominal (IDR)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nilai {form.type === 'percent' ? '(%)' : '(IDR)'} *</Text>
              <TextInput
                style={styles.formInput}
                placeholder={form.type === 'percent' ? '10' : '50000'}
                placeholderTextColor={colors.textMuted}
                value={form.value}
                onChangeText={(v) => setForm((f) => ({ ...f, value: v }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Berlaku untuk Paket</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.planPicker}>
                  <TouchableOpacity
                    style={[styles.planChip, form.applicablePlan === null && styles.planChipActive]}
                    onPress={() => setForm((f) => ({ ...f, applicablePlan: null }))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.planChipText, form.applicablePlan === null && styles.planChipTextActive]}>
                      Semua
                    </Text>
                  </TouchableOpacity>
                  {PLANS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.planChip,
                        form.applicablePlan === p && { backgroundColor: PLAN_COLORS[p] },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, applicablePlan: p }))}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.planChipText,
                          form.applicablePlan === p && { color: '#fff' },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Berlaku untuk Siklus</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.planPicker}>
                  <TouchableOpacity
                    style={[styles.planChip, form.applicableBillingCycle === null && styles.planChipActive]}
                    onPress={() => setForm((f) => ({ ...f, applicableBillingCycle: null }))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.planChipText, form.applicableBillingCycle === null && styles.planChipTextActive]}>
                      Semua
                    </Text>
                  </TouchableOpacity>
                  {BILLING_CYCLES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.planChip,
                        form.applicableBillingCycle === c && styles.planChipActive,
                      ]}
                      onPress={() => setForm((f) => ({ ...f, applicableBillingCycle: c }))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.planChipText, form.applicableBillingCycle === c && styles.planChipTextActive]}>
                        {c === 'monthly' ? 'Bulanan' : 'Tahunan'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Maks. Penggunaan (kosong = tak terbatas)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="100"
                placeholderTextColor={colors.textMuted}
                value={form.maxUsages}
                onChangeText={(v) => setForm((f) => ({ ...f, maxUsages: v }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tanggal Kadaluarsa (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="2025-12-31"
                placeholderTextColor={colors.textMuted}
                value={form.expires}
                onChangeText={(v) => setForm((f) => ({ ...f, expires: v }))}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>
                {createMutation.isPending ? 'Membuat…' : 'Buat Voucher'}
              </Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, gap: spacing.sm },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardInfo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
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
    maxHeight: '85%',
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
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
  },
  formGroup: { gap: spacing.xs },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
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
  typePicker: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  typeOptionTextActive: { color: '#fff' },
  planPicker: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  planChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
  },
  planChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  planChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' },
  planChipTextActive: { color: '#fff' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
