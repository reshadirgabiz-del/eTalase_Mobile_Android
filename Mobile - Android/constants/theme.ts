export const colors = {
  primary: '#1A1A18',
  primaryDark: '#080807',
  primaryLight: '#E8E5DE',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  info: '#6366F1',
  infoLight: '#EEF2FF',
  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',
  teal: '#14B8A6',
  tealLight: '#F0FDFA',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
  gray: '#8A8880',
  background: '#F5F3EE',
  surface: '#FFFFFF',
  border: '#D0CCC4',
  text: '#1A1A18',
  textSecondary: '#5A5852',
  textMuted: '#8A8880',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const PLAN_COLORS: Record<string, string> = {
  free: colors.gray,
  lifetime: colors.teal,
};

export const STATUS_COLORS: Record<string, string> = {
  active: colors.success,
  pending: colors.warning,
  expired: colors.danger,
  cancelled: colors.gray,
};
