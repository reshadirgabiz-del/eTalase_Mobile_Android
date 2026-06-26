import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

interface Props {
  label: string;
  value: number | string;
  color?: string;
  small?: boolean;
}

export function StatCard({ label, value, color = colors.primary, small = false }: Props) {
  return (
    <View style={[styles.card, small && styles.cardSmall]}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.body}>
        <Text style={[styles.value, small && styles.valueSmall, { color }]}>{value}</Text>
        <Text style={[styles.label, small && styles.labelSmall]} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 80,
  },
  cardSmall: {
    minHeight: 64,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 2,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  valueSmall: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 11,
  },
});
