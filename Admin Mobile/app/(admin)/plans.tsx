import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatIDR, plansApi } from '@/lib/api';
import type { Plan, PlanPrice } from '@/lib/types';
import { colors, PLAN_COLORS, radius, spacing } from '@/constants/theme';

const PLAN_ORDER: Plan[] = ['starter', 'growth', 'business', 'enterprise'];

export default function PlansScreen() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [priceInput, setPriceInput] = useState('');

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list,
  });

  const sorted = PLAN_ORDER.map((p) => data.find((d) => d.plan === p)).filter(Boolean) as PlanPrice[];

  const updateMutation = useMutation({
    mutationFn: ({ plan, price }: { plan: Plan; price: number }) =>
      plansApi.updatePrice(plan, price),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      setEditing(null);
      setPriceInput('');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleSave = (plan: Plan) => {
    const price = parseInt(priceInput.replace(/\D/g, ''), 10);
    if (!price || price < 0) {
      Alert.alert('Error', 'Masukkan harga yang valid');
      return;
    }
    Alert.alert('Ubah Harga?', `Set harga ${plan} ke ${formatIDR(price)}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Simpan', onPress: () => updateMutation.mutate({ plan, price }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <Text style={styles.title}>Paket</Text>
        <Text style={styles.subtitle}>Harga langganan per bulan</Text>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.list}>
            {sorted.map((pp) => {
              const planColor = PLAN_COLORS[pp.plan] ?? colors.gray;
              const isEditing = editing === pp.plan;
              return (
                <View key={pp.plan} style={[styles.card, { borderLeftColor: planColor, borderLeftWidth: 4 }]}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.planName, { color: planColor }]}>
                      {pp.plan.charAt(0).toUpperCase() + pp.plan.slice(1)}
                    </Text>
                    <Text style={styles.priceText}>{formatIDR(pp.price_idr)}</Text>
                  </View>

                  {isEditing ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Harga baru (IDR)"
                        placeholderTextColor={colors.textMuted}
                        value={priceInput}
                        onChangeText={setPriceInput}
                        keyboardType="numeric"
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: planColor }]}
                        onPress={() => handleSave(pp.plan)}
                        disabled={updateMutation.isPending}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.saveBtnText}>
                          {updateMutation.isPending ? '…' : 'Simpan'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => { setEditing(null); setPriceInput(''); }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cancelBtnText}>Batal</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.editBtn, { borderColor: planColor }]}
                      onPress={() => { setEditing(pp.plan); setPriceInput(String(pp.price_idr)); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.editBtnText, { color: planColor }]}>Ubah Harga</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  list: { gap: spacing.sm },
  center: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
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
  planName: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  editBtn: {
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  saveBtn: {
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
