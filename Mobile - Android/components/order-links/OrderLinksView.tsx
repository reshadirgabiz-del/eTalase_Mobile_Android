import { Check, ChevronDown, Copy, History, Link2, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, Share, Text, TextInput, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Screen,
  ScreenSkeleton,
  StatusPill,
  ToggleRow,
  colors,
} from '@/components/ui';
import { FRONTEND_BASE } from '@/lib/api';
import type { CustomerWithHistory, OrderLink, Product } from '@/lib/types';
import { formatDate, formatIDR } from '@/lib/types';
import type { OrderLinkFilter, SelectedItem } from '@/features/order-links/useOrderLinks';
import { useT, type TranslationKey } from '@/lib/i18n';

interface OrderLinksViewProps {
  storeId: string;
  message: string;
  links?: OrderLink[];
  products: Product[];
  customers: CustomerWithHistory[];
  selectedItems: SelectedItem[];
  isPermanent: boolean;
  linkType: 'preset' | 'history';
  customerLabel: string;
  filter: OrderLinkFilter;
  loading: boolean;
  creating: boolean;
  onMessageChange: (value: string) => void;
  onToggleProduct: (productId: string, checked: boolean) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onPermanentChange: (value: boolean) => void;
  onLinkTypeChange: (type: 'preset' | 'history') => void;
  onCustomerLabelChange: (value: string) => void;
  onFilterChange: (value: OrderLinkFilter) => void;
  onCreateLink: () => void;
  onRemoveLink: (id: string) => void;
  onResetForm: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const FILTER_KEYS: { value: OrderLinkFilter; key: TranslationKey }[] = [
  { value: 'all', key: 'orderLinks.filter.all' },
  { value: 'preset', key: 'orderLinks.filter.preset' },
  { value: 'history', key: 'orderLinks.filter.history' },
  { value: 'permanent', key: 'orderLinks.filter.permanent' },
  { value: 'expired', key: 'orderLinks.filter.expired' },
];

function isExpired(link: OrderLink) {
  if (link.is_permanent) return false;
  if (!link.expires_at) return false;
  return new Date(link.expires_at) < new Date();
}

function buildLinkUrl(storeId: string, linkId: string) {
  const base = FRONTEND_BASE || 'https://app.e-talase.com';
  return `${base}/${storeId}/order-link/${linkId}`;
}

export function OrderLinksView({
  storeId,
  message,
  links,
  products,
  customers,
  selectedItems,
  isPermanent,
  linkType,
  customerLabel,
  filter,
  loading,
  creating,
  onMessageChange,
  onToggleProduct,
  onQuantityChange,
  onPermanentChange,
  onLinkTypeChange,
  onCustomerLabelChange,
  onFilterChange,
  onCreateLink,
  onRemoveLink,
  onResetForm,
  refreshing,
  onRefresh,
}: OrderLinksViewProps) {
  const t = useT();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [customerListOpen, setCustomerListOpen] = useState(false);

  const filteredLinks = useMemo(() => {
    if (!links) return [];
    return links.filter((link) => {
      const expired = isExpired(link);
      if (filter === 'all') return true;
      if (filter === 'expired') return expired;
      if (filter === 'permanent') return link.is_permanent && !expired;
      if (filter === 'history') return link.link_type === 'history';
      if (filter === 'preset') return (link.link_type ?? 'preset') === 'preset';
      return true;
    });
  }, [links, filter]);

  const filteredCustomers = useMemo(() => {
    const query = customerLabel.trim().toLowerCase();
    if (!query) return customers.slice(0, 20);
    return customers.filter((c) => c.name.toLowerCase().includes(query)).slice(0, 20);
  }, [customers, customerLabel]);

  const openCreator = () => {
    onResetForm();
    setCreatorOpen(true);
  };

  const closeCreator = () => {
    setCreatorOpen(false);
    setCustomerListOpen(false);
  };

  const handleCreate = () => {
    onCreateLink();
    closeCreator();
  };

  const handleShare = (url: string) => {
    Share.share({ message: url }).catch(() => Alert.alert(t('common.failed'), t('orderLinks.shareFailed')));
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('orderLinks.deleteTitle'), t('orderLinks.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => onRemoveLink(id) },
    ]);
  };

  if (loading) return <ScreenSkeleton cards={4} />;

  return (
    <Screen
      title={t('orderLinks.title')}
      subtitle={t('orderLinks.subtitle')}
      right={<Button icon={Plus} onPress={openCreator}>{t('orderLinks.create')}</Button>}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTER_KEYS.map((opt) => {
          const active = filter === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onFilterChange(opt.value)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  minHeight: 30,
                  borderRadius: 999,
                  backgroundColor: active ? colors.text : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.text : '#DBD4C7',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: active ? '#FFFFFF' : colors.text,
                }}
              >
                {t(opt.key)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!loading && filteredLinks.length === 0 ? (
        <EmptyState
          icon={Link2}
          iconColor="#7AAFC0"
          title={t('orderLinks.emptyTitle')}
          body={filter === 'all' ? t('orderLinks.emptyBody') : t('orderLinks.emptyFiltered')}
        />
      ) : null}

      {filteredLinks.map((link) => {
        const expired = isExpired(link);
        const url = buildLinkUrl(storeId, link.id);
        const isHistory = link.link_type === 'history';
        const pillLabel = expired
          ? t('orderLinks.pill.expired')
          : isHistory
            ? t('orderLinks.pill.history')
            : link.is_permanent
              ? t('orderLinks.pill.permanent')
              : t('orderLinks.pill.active');
        const pillTone: 'green' | 'blue' | 'purple' | 'red' = expired
          ? 'red'
          : isHistory
            ? 'purple'
            : link.is_permanent
              ? 'blue'
              : 'green';
        return (
          <Card key={link.id}>
            <StatusPill label={pillLabel} tone={pillTone} pinTopRight />
            <View style={{ paddingRight: 100 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.text }}>
                {isHistory
                  ? `${t('orderLinks.historyPrefix')} · ${link.customer_label ?? t('orderLinks.customerFallback')}`
                  : link.is_permanent
                    ? t('orderLinks.permanentLabel')
                    : t('orderLinks.temporaryLabel')}
              </Text>
              {!isHistory ? (
                <Text style={{ marginTop: 2, color: colors.muted, fontSize: 11.5 }}>
                  {link.items.length} {t('orderLinks.productsSuffix')}
                </Text>
              ) : null}
            </View>
            <View
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: 10,
                backgroundColor: '#F6F3EC',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Link2 size={13} color={colors.muted} />
              <View style={{ flex: 1, flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={{ color: colors.green, fontWeight: '700', fontSize: 12.5 }}
                >
                  {url}
                </Text>
              </View>
              <Pressable onPress={() => handleShare(url)} hitSlop={8}>
                <Copy size={14} color={colors.muted} />
              </Pressable>
            </View>
            <View
              style={{
                marginTop: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                {t('orderLinks.createdPrefix')} {formatDate(link.created_at)}
              </Text>
              <Pressable onPress={() => handleDelete(link.id)} hitSlop={8}>
                <Trash2 size={15} color={colors.red} />
              </Pressable>
            </View>
          </Card>
        );
      })}

      <Modal
        visible={creatorOpen}
        animationType="slide"
        transparent
        onRequestClose={closeCreator}
      >
        <Pressable onPress={closeCreator} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            gap: 14,
            maxHeight: '90%',
          }}>
            <View style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 999, backgroundColor: '#DDD6C6' }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{t('orderLinks.modal.title')}</Text>

            <View style={{ flexDirection: 'row', backgroundColor: '#E9E3D5', borderRadius: 12, padding: 3, gap: 3 }}>
              {(['preset', 'history'] as const).map((type) => {
                const active = linkType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => onLinkTypeChange(type)}
                    style={{
                      flex: 1,
                      minHeight: 34,
                      borderRadius: 9,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? colors.surface : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontSize: 12.5,
                      fontWeight: active ? '700' : '600',
                      color: active ? colors.text : colors.muted,
                    }}>
                      {type === 'preset' ? t('orderLinks.modal.linkProduct') : t('orderLinks.modal.linkHistory')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ color: colors.muted, lineHeight: 18, fontSize: 12.5 }}>
              {linkType === 'history'
                ? t('orderLinks.modal.descHistory')
                : t('orderLinks.modal.descPreset')}
            </Text>

            {linkType === 'preset' ? (
              <View style={{ maxHeight: 320, gap: 8 }}>
                {products.length === 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 12.5 }}>{t('orderLinks.modal.noProducts')}</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {products.map((product) => {
                      const selected = selectedItems.find((item) => item.productId === product.id);
                      const isSelected = Boolean(selected);
                      return (
                        <View
                          key={product.id}
                          style={{
                            borderWidth: 1,
                            borderColor: isSelected ? colors.text : '#E0DDD6',
                            borderRadius: 12,
                            padding: 10,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Pressable
                              onPress={() => onToggleProduct(product.id, !isSelected)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                borderWidth: 1.5,
                                borderColor: isSelected ? colors.text : '#C6BFB0',
                                backgroundColor: isSelected ? colors.text : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {isSelected ? <Check size={14} color="#FFFFFF" /> : null}
                            </Pressable>
                            <Pressable
                              style={{ flex: 1 }}
                              onPress={() => onToggleProduct(product.id, !isSelected)}
                            >
                              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                                {product.name}
                              </Text>
                              <Text style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>
                                {formatIDR(product.price)}
                              </Text>
                            </Pressable>
                            {isSelected ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Pressable
                                  onPress={() => onQuantityChange(product.id, (selected?.quantity ?? 1) - 1)}
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: '#DBD4C7',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text style={{ color: colors.text, fontWeight: '800' }}>−</Text>
                                </Pressable>
                                <TextInput
                                  value={String(selected?.quantity ?? 1)}
                                  onChangeText={(value: string) => {
                                    const n = parseInt(value, 10);
                                    onQuantityChange(product.id, Number.isFinite(n) ? n : 1);
                                  }}
                                  keyboardType="numeric"
                                  style={{
                                    width: 34,
                                    textAlign: 'center',
                                    color: colors.text,
                                    fontWeight: '700',
                                    fontSize: 13,
                                    padding: 0,
                                  }}
                                />
                                <Pressable
                                  onPress={() => onQuantityChange(product.id, (selected?.quantity ?? 1) + 1)}
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: '#DBD4C7',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text style={{ color: colors.text, fontWeight: '800' }}>+</Text>
                                </Pressable>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <View>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 6 }}>{t('orderLinks.modal.customer')}</Text>
                  <Pressable
                    onPress={() => setCustomerListOpen((prev) => !prev)}
                    style={{
                      minHeight: 46,
                      borderRadius: 12,
                      borderColor: '#E6E0D5',
                      borderWidth: 1,
                      backgroundColor: '#FBFAF6',
                      paddingHorizontal: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <TextInput
                      value={customerLabel}
                      onChangeText={(value: string) => {
                        onCustomerLabelChange(value);
                        setCustomerListOpen(true);
                      }}
                      placeholder={t('orderLinks.modal.customerPlaceholder')}
                      placeholderTextColor="#B0A899"
                      style={{ flex: 1, color: colors.text, fontSize: 14, padding: 0 }}
                    />
                    <ChevronDown size={16} color={colors.muted} />
                  </Pressable>
                  {customerListOpen && filteredCustomers.length > 0 ? (
                    <View
                      style={{
                        marginTop: 6,
                        borderWidth: 1,
                        borderColor: '#E6E0D5',
                        borderRadius: 12,
                        backgroundColor: colors.surface,
                        maxHeight: 220,
                        overflow: 'hidden',
                      }}
                    >
                      {filteredCustomers.map((customer) => (
                        <Pressable
                          key={`${customer.name}-${customer.latestOrderId}`}
                          onPress={() => {
                            onCustomerLabelChange(customer.name);
                            setCustomerListOpen(false);
                          }}
                          style={({ pressed }) => [
                            {
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: colors.line,
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}
                        >
                          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>{customer.name}</Text>
                          {customer.products.length ? (
                            <Text style={{ color: colors.muted, fontSize: 11.5, marginTop: 2 }} numberOfLines={1}>
                              {customer.products.join(', ')}
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
                <View
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: '#F1ECDE',
                    flexDirection: 'row',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <History size={14} color={colors.text} />
                  <Text style={{ flex: 1, color: colors.text, fontSize: 12, lineHeight: 17 }}>
                    {t('orderLinks.modal.historyInfo')}
                  </Text>
                </View>
              </View>
            )}

            {linkType === 'preset' ? (
              <>
                <Field
                  value={message}
                  onChangeText={onMessageChange}
                  placeholder={t('orderLinks.modal.messagePlaceholder')}
                />
                <ToggleRow
                  title={t('orderLinks.modal.permanentTitle')}
                  description={t('orderLinks.modal.permanentDesc')}
                  value={isPermanent}
                  onValueChange={onPermanentChange}
                />
              </>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <Button variant="light" onPress={closeCreator} fullWidth>{t('common.cancel')}</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  onPress={handleCreate}
                  disabled={
                    creating ||
                    (linkType === 'preset' && selectedItems.length === 0) ||
                    (linkType === 'history' && !customerLabel.trim())
                  }
                  fullWidth
                >
                  {t('orderLinks.modal.submit')}
                </Button>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
