import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboardApi } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { colors, PLAN_COLORS, spacing, STATUS_COLORS } from '@/constants/theme';

export default function DashboardScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getStats,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Ringkasan platform Jastip</Text>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : data ? (
          <>
            {/* Top stats */}
            <View style={styles.row}>
              <StatCard label="Total Toko" value={data.stores} color={colors.teal} />
              <StatCard
                label="Langganan Aktif"
                value={data.subscriptions.active}
                color={colors.info}
              />
            </View>
            <View style={styles.row}>
              <StatCard
                label="Voucher Aktif"
                value={data.vouchers.active}
                color={colors.purple}
              />
              <StatCard
                label="Total Voucher"
                value={data.vouchers.total}
                color={colors.gray}
              />
            </View>

            {/* Subscriptions breakdown */}
            <Text style={styles.sectionTitle}>Status Langganan</Text>
            <View style={styles.row}>
              <StatCard label="Aktif" value={data.subscriptions.active} color={STATUS_COLORS.active} small />
              <StatCard label="Pending" value={data.subscriptions.pending} color={STATUS_COLORS.pending} small />
            </View>
            <View style={styles.row}>
              <StatCard label="Expired" value={data.subscriptions.expired} color={STATUS_COLORS.expired} small />
              <StatCard label="Dibatalkan" value={data.subscriptions.cancelled} color={STATUS_COLORS.cancelled} small />
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
              Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
            </Text>
          </>
        ) : (
          <Text style={styles.empty}>Gagal memuat data</Text>
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  center: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  footer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
