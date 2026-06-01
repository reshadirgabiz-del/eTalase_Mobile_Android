import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storesApi, formatDate } from '@/lib/api';
import type { StoreListRow } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { colors, PLAN_COLORS, radius, spacing } from '@/constants/theme';

function StoreRow({ item }: { item: StoreListRow }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="storefront-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          {item.plan ? (
            <Badge label={item.plan} color={PLAN_COLORS[item.plan] ?? colors.gray} size="sm" />
          ) : (
            <Badge label="free" color={colors.gray} size="sm" />
          )}
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.metaText}>
            <Ionicons name="people-outline" size={11} /> {item.member_count} anggota
          </Text>
          {item.sub_expires_at && (
            <Text style={styles.metaText}>Exp: {formatDate(item.sub_expires_at)}</Text>
          )}
        </View>
        <Text style={styles.rowId} numberOfLines={1}>{item.id}</Text>
      </View>
    </View>
  );
}

export default function StoresScreen() {
  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['stores'],
    queryFn: storesApi.list,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Toko</Text>
        <Text style={styles.subtitle}>{data.length} toko terdaftar</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => <StoreRow item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Belum ada toko</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
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
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  rowMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowId: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
});
