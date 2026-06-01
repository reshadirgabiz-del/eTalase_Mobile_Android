import { StyleSheet, Text, View } from 'react-native';
import { radius } from '@/constants/theme';

interface Props {
  label: string;
  color: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, size = 'md' }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  textSm: {
    fontSize: 10,
  },
});
