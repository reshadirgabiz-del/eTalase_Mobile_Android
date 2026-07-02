import { ComponentType, ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Check, ChevronDown, Globe, Search } from 'lucide-react-native';
import { useLanguageStore, type Language } from '@/store/languageStore';

export const SERIF_FONT = 'PlayfairDisplay_700Bold';
export const SERIF_FONT_SEMI = 'PlayfairDisplay_600SemiBold';

export const colors = {
  bg: '#F6F3EC',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEAE0',
  text: '#1A1A18',
  muted: '#8A8275',
  subtle: '#B0A899',
  line: '#ECE7DD',
  green: '#5C6B3F',
  blue: '#2F6BD6',
  red: '#D64531',
  amber: '#B07A00',
  cyan: '#0FB5BA',
};

export const SCREEN_TOP_INSET = 72;

export function Screen({
  title,
  subtitle,
  children,
  right,
  scroll = true,
  headerSpacing = SCREEN_TOP_INSET,
  refreshing,
  onRefresh,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  scroll?: boolean;
  headerSpacing?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const header = title ? (
    <View style={[styles.header, { paddingTop: headerSpacing }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  ) : null;

  return (
    <View style={styles.screen}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, { flexGrow: 1 }, !title && { paddingTop: headerSpacing }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.green} />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, !title && { paddingTop: headerSpacing }]}>{children}</View>
      )}
    </View>
  );
}

export function Card({
  children,
  style,
  accent,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  accent?: string;
}) {
  return (
    <View style={[styles.card, accent ? { borderLeftColor: accent, borderLeftWidth: 4 } : null, style]}>
      {children}
    </View>
  );
}

export function Button({
  children,
  onPress,
  variant = 'dark',
  size = 'md',
  disabled,
  icon: Icon,
  iconSize,
  fullWidth,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'dark' | 'green' | 'light' | 'danger' | 'success' | 'ghost' | 'dashed' | 'blue' | 'amber' | 'cyan' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: ComponentType<{ size?: number; color?: string }>;
  iconSize?: number;
  fullWidth?: boolean;
}) {
  const variantStyle =
    variant === 'green'
      ? styles.buttonGreen
      : variant === 'light'
        ? styles.buttonLight
        : variant === 'danger'
          ? styles.buttonDanger
          : variant === 'success'
            ? styles.buttonSuccess
            : variant === 'ghost'
              ? styles.buttonGhost
              : variant === 'dashed'
                ? styles.buttonDashed
                : variant === 'blue'
                  ? styles.buttonBlue
                  : variant === 'amber'
                    ? styles.buttonAmber
                    : variant === 'cyan'
                      ? styles.buttonCyan
                      : variant === 'purple'
                        ? styles.buttonPurple
                        : styles.buttonDark;
  const lightFamily = variant === 'light' || variant === 'ghost' || variant === 'dashed';
  const textStyle = lightFamily ? styles.buttonTextDark : styles.buttonTextLight;
  const sizeStyle = size === 'sm' ? styles.buttonSm : size === 'lg' ? styles.buttonLg : styles.buttonMd;
  const iconColor = lightFamily ? colors.text : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        sizeStyle,
        fullWidth && { alignSelf: 'stretch' },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {Icon ? <Icon size={iconSize ?? (size === 'sm' ? 14 : 18)} color={iconColor} /> : null}
      <Text style={[textStyle, size === 'sm' && { fontSize: 13 }, size === 'lg' && { fontSize: 16 }]}>{children}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
      <TextInput placeholderTextColor="#B0A899" {...props} style={[styles.input, props.style]} />
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.search}>
      <Search size={18} color={colors.subtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        style={styles.searchInput}
      />
    </View>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string; icon?: ComponentType<{ size?: number; color?: string }> }[];
}) {
  return (
    <View style={styles.tabs}>
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && { opacity: 0.85 }]}
          >
            {Icon ? <Icon size={15} color={active ? colors.text : colors.muted} /> : null}
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FilterChip({
  label,
  dotColor,
  onPress,
}: {
  label: string;
  dotColor?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}>
      <View style={[styles.chipDot, { backgroundColor: dotColor ?? colors.text }]} />
      <Text style={styles.chipText}>{label}</Text>
      <ChevronDown size={14} color={colors.text} />
    </Pressable>
  );
}

export function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: T;
  options: { value: T; label: string; dotColor?: string }[];
  onChange: (next: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const active = options.find((option) => option.value === value);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.chipDot, { backgroundColor: active?.dotColor ?? colors.text }]} />
        <Text style={styles.chipText} numberOfLines={1}>{active?.label ?? placeholder ?? 'Pilih'}</Text>
        <ChevronDown size={14} color={colors.text} />
      </Pressable>
      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable onPress={() => setOpen(false)} style={styles.dropdownBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.dropdownSheet}>
            <View style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 999, backgroundColor: '#DDD6C6', marginBottom: 6 }} />
            <Text style={styles.dropdownTitle}>Filter Status</Text>
            <View>
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      selected && { backgroundColor: '#F1ECDE' },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: option.dotColor ?? colors.text }]} />
                    <Text style={[styles.dropdownItemText, selected && { fontWeight: '800' }]}>{option.label}</Text>
                    {selected ? <Check size={16} color={colors.green} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: ComponentType<{ size?: number; color?: string }>;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionLabel}>
      {Icon ? <Icon size={14} color={colors.muted} /> : null}
      <Text style={styles.sectionLabelText}>{children}</Text>
    </View>
  );
}

export function InfoBanner({
  tone = 'info',
  icon: Icon,
  children,
}: {
  tone?: 'info' | 'warn' | 'success' | 'premium';
  icon?: ComponentType<{ size?: number; color?: string }>;
  children: ReactNode;
}) {
  const toneStyle =
    tone === 'warn'
      ? { backgroundColor: '#FBF1DC', borderColor: '#F1DDA8', color: '#9B6A00' }
      : tone === 'success'
        ? { backgroundColor: '#E8F0E1', borderColor: '#CADBB7', color: '#476131' }
        : tone === 'premium'
          ? { backgroundColor: '#FFF6DE', borderColor: '#F1D77A', color: '#8A6B12' }
          : { backgroundColor: '#E7EAF7', borderColor: '#C8D0EE', color: '#3E4CA1' };
  return (
    <View style={[styles.banner, { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor }]}>
      {Icon ? <Icon size={16} color={toneStyle.color} /> : null}
      <Text style={[styles.bannerText, { color: toneStyle.color }]}>{children}</Text>
    </View>
  );
}

export function IconBadge({
  text,
  bg = '#EEEAE0',
  color = colors.text,
  size = 44,
  rounded = 12,
}: {
  text: string;
  bg?: string;
  color?: string;
  size?: number;
  rounded?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontWeight: '800', fontSize: size * 0.42 }}>{text}</Text>
    </View>
  );
}

export function StoreAvatar({
  name,
  logoUrl,
  bg = '#E0E7FB',
  color = '#3F5EBF',
  size = 44,
  rounded = 12,
}: {
  name: string;
  logoUrl?: string | null;
  bg?: string;
  color?: string;
  size?: number;
  rounded?: number;
}) {
  const initial = (name || '?').slice(0, 1).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ color, fontWeight: '800', fontSize: size * 0.42 }}>{initial}</Text>
      )}
    </View>
  );
}

export function LanguageToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const options: { value: Language; label: string }[] = [
    { value: 'id', label: 'ID' },
    { value: 'en', label: 'EN' },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.line,
        padding: 3,
        gap: 3,
      }}
    >
      {!compact ? (
        <View style={{ paddingLeft: 8, paddingRight: 4, alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={12} color={colors.muted} />
        </View>
      ) : null}
      {options.map((option) => {
        const active = language === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setLanguage(option.value)}
            style={({ pressed }) => [
              {
                minHeight: 26,
                paddingHorizontal: 10,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.text : 'transparent',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 0.6,
                color: active ? '#FFFFFF' : colors.text,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {description ? <Text style={styles.toggleDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D6D0C2', true: '#1A1A18' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function EmptyState({
  title,
  body,
  icon: Icon,
  iconColor,
  action,
}: {
  title: string;
  body: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  iconColor?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      {Icon ? (
        <View style={styles.emptyIcon}>
          <Icon size={36} color={iconColor ?? '#6F8A95'} />
        </View>
      ) : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action ? <View style={{ marginTop: 18 }}>{action}</View> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.green} />
    </View>
  );
}

export function BrandedLoading() {
  return (
    <View style={styles.brandedLoading}>
      <View style={styles.brandedLogoWrap}>
        <Image source={require('../UI:UX/assets/logo.png')} style={styles.brandedLogoImage} resizeMode="contain" />
        <View style={styles.brandedMobileBadge}>
          <Text style={styles.brandedMobileBadgeText}>MOBILE</Text>
        </View>
      </View>
      <Text style={styles.brandedLoadingText}>Loading</Text>
      <View style={styles.brandedSkeletonStack}>
        <Skeleton width="72%" height={14} />
        <Skeleton width="58%" height={14} />
        <Skeleton width="66%" height={14} />
      </View>
    </View>
  );
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: '#E8E2D7',
          opacity: 0.9,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="34%" height={13} />
          <Skeleton width={72} height={24} radius={999} />
        </View>
        <Skeleton width="68%" height={20} />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} width={index % 2 ? '52%' : '88%'} height={13} />
        ))}
      </View>
    </Card>
  );
}

export function ScreenSkeleton({
  title = true,
  cards = 4,
}: {
  title?: boolean;
  cards?: number;
}) {
  return (
    <Screen>
      {title ? (
        <View style={{ gap: 10, marginBottom: 8 }}>
          <Skeleton width="48%" height={28} />
          <Skeleton width="36%" height={13} />
        </View>
      ) : null}
      {Array.from({ length: cards }).map((_, index) => (
        <CardSkeleton key={index} rows={index % 2 ? 2 : 3} />
      ))}
    </Screen>
  );
}

export function StatusPill({
  label,
  tone = 'neutral',
  pinTopRight,
}: {
  label: string;
  tone?: 'neutral' | 'blue' | 'green' | 'red' | 'amber' | 'cyan' | 'purple';
  pinTopRight?: boolean;
}) {
  const toneStyle =
    tone === 'blue'
      ? styles.pillBlue
      : tone === 'green'
        ? styles.pillGreen
        : tone === 'red'
          ? styles.pillRed
          : tone === 'amber'
            ? styles.pillAmber
            : tone === 'cyan'
              ? styles.pillCyan
              : tone === 'purple'
                ? styles.pillPurple
                : styles.pillNeutral;
  const dotColor =
    tone === 'blue'
      ? '#2F6BD6'
      : tone === 'green'
        ? '#4F7A3E'
        : tone === 'red'
          ? '#D64531'
          : tone === 'amber'
            ? '#B07A00'
            : tone === 'cyan'
              ? '#0FB5BA'
              : tone === 'purple'
                ? '#7A4FC8'
                : '#6B6357';
  const textColor =
    tone === 'blue'
      ? '#1F4DA0'
      : tone === 'green'
        ? '#3D5E30'
        : tone === 'red'
          ? '#9C2A1E'
          : tone === 'amber'
            ? '#7E5500'
            : tone === 'cyan'
              ? '#076E72'
              : tone === 'purple'
                ? '#522F90'
                : '#4A4339';
  return (
    <View style={[
      styles.pill,
      toneStyle,
      pinTopRight && { position: 'absolute', top: 10, right: 10, zIndex: 2 },
    ]}>
      <View style={[styles.pillDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export function Row({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: ComponentType<{ size?: number; color?: string }> }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelWrap}>
        {Icon ? <Icon size={14} color={colors.muted} /> : null}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: colors.line, marginVertical: 10 }, style]} />;
}

export const toneAccent = {
  blue: '#7AA2E8',
  green: '#9CB68E',
  red: '#E8927E',
  amber: '#E5C271',
  cyan: '#6FD3D7',
  purple: '#B49BE2',
  neutral: '#D6CFC0',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  title: { fontFamily: SERIF_FONT, fontSize: 32, color: colors.text, letterSpacing: -0.2, lineHeight: 40 },
  subtitle: { marginTop: 3, fontSize: 12.5, color: '#9B9486' },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 11 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
  },
  button: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  buttonSm: { minHeight: 34, paddingHorizontal: 12, borderRadius: 10 },
  buttonMd: { minHeight: 42 },
  buttonLg: { minHeight: 50, borderRadius: 14 },
  buttonDark: { backgroundColor: colors.text },
  buttonGreen: { backgroundColor: colors.green },
  buttonLight: { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#DBD4C7' },
  buttonDanger: { backgroundColor: colors.red },
  buttonSuccess: { backgroundColor: '#2E7D52' },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDashed: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9B9486',
  },
  buttonBlue: { backgroundColor: '#2F6BD6' },
  buttonAmber: { backgroundColor: '#E69611' },
  buttonCyan: { backgroundColor: '#0FB5BA' },
  buttonPurple: { backgroundColor: '#7A4FC8' },
  buttonTextLight: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  buttonTextDark: { color: colors.text, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.82 },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderColor: '#E6E0D5',
    borderWidth: 1,
    backgroundColor: '#FBFAF6',
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 14,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.text },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: colors.text, paddingVertical: 0 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E9E3D5',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  tabActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabText: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.text, fontWeight: '700' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text,
  },
  chipDot: { width: 7, height: 7, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dropdownSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    gap: 6,
  },
  dropdownTitle: { fontSize: 14, fontWeight: '700', color: colors.text, paddingHorizontal: 4, marginBottom: 4 },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dropdownItemText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabelText: { fontSize: 10.5, letterSpacing: 1.2, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 11,
    borderRadius: 11,
    borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  toggleTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  toggleDesc: { marginTop: 2, fontSize: 11.5, color: colors.muted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 22 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16.5, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyBody: { marginTop: 6, fontSize: 13, lineHeight: 19, color: colors.muted, textAlign: 'center' },
  loading: { paddingVertical: 36, alignItems: 'center' },
  brandedLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor: colors.bg,
  },
  brandedLogoWrap: { width: 248, height: 76 },
  brandedLogoImage: { width: 248, height: 76 },
  brandedMobileBadge: {
    position: 'absolute',
    top: -10,
    right: -16,
    height: 24,
    borderRadius: 9,
    paddingHorizontal: 10,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandedMobileBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  brandedLoadingText: { marginTop: 34, fontSize: 14, fontWeight: '700', color: colors.text },
  brandedSkeletonStack: { width: '100%', maxWidth: 260, marginTop: 18, alignItems: 'center', gap: 10 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillDot: { width: 5, height: 5, borderRadius: 999 },
  pillNeutral: { backgroundColor: '#EEEAE0' },
  pillBlue: { backgroundColor: '#E4ECFB' },
  pillGreen: { backgroundColor: '#E5F0E0' },
  pillRed: { backgroundColor: '#FBE0DA' },
  pillAmber: { backgroundColor: '#FBEEC8' },
  pillCyan: { backgroundColor: '#D4F2F1' },
  pillPurple: { backgroundColor: '#ECE0F9' },
  pillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 6 },
  rowLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  rowLabel: { fontSize: 12.5, color: colors.muted },
  rowValue: { flex: 1.2, fontSize: 13, color: colors.text, fontWeight: '600', textAlign: 'right' },
});
