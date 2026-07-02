import {
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Inbox,
  Link2,
  Mail,
  Map as MapIcon,
  MapPin,
  Package,
  Phone,
  RotateCw,
  User as UserIcon,
  XCircle,
} from 'lucide-react-native';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  Field,
  InfoBanner,
  Row,
  Screen,
  ScreenSkeleton,
  SectionLabel,
  StatusPill,
  colors,
} from '@/components/ui';
import { formatDate, formatIDR, type Order, type OrderStatus, shortId } from '@/lib/types';
import { orderStatuses } from '@/features/orders/useOrderDetail';
import { useT, type TranslationKey } from '@/lib/i18n';

interface OrderDetailViewProps {
  id: string;
  order?: Order;
  loading: boolean;
  trackingNumber: string;
  courierName: string;
  savingManualShipment: boolean;
  archiving: boolean;
  confirmingTransfer: boolean;
  downloadingLabel: boolean;
  uploadingPhoto: boolean;
  historyLinkUrl?: string | null;
  creatingHistoryLink?: boolean;
  isOwner?: boolean;
  onBack: () => void;
  onTrackingNumberChange: (value: string) => void;
  onCourierNameChange: (value: string) => void;
  onUpdateStatus: (status: OrderStatus) => void;
  onSaveManualShipment: () => void;
  onToggleArchive: () => void;
  onConfirmTransfer: () => void;
  onDownloadLabel: () => void;
  onUploadPhoto: () => void;
  onOpenAttachment: (url?: string | null) => void;
  onCreateHistoryLink?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const HISTORY_LINK_STATUSES: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered'];

const STATUS_LABEL_KEYS: Record<OrderStatus, TranslationKey> = {
  pending: 'orders.status.pending',
  paid: 'orders.status.paid',
  processing: 'orders.status.processing',
  shipped: 'orders.status.shipped',
  delivered: 'orders.status.delivered',
  cancelled: 'orders.status.cancelled',
};

const STATUS_TONE: Record<OrderStatus, 'amber' | 'blue' | 'cyan' | 'green' | 'red' | 'neutral'> = {
  pending: 'amber',
  paid: 'blue',
  processing: 'blue',
  shipped: 'cyan',
  delivered: 'green',
  cancelled: 'red',
};

export function OrderDetailView({
  id,
  order,
  loading,
  trackingNumber,
  courierName,
  savingManualShipment,
  archiving,
  confirmingTransfer,
  downloadingLabel,
  uploadingPhoto,
  historyLinkUrl,
  creatingHistoryLink,
  isOwner,
  onBack,
  onTrackingNumberChange,
  onCourierNameChange,
  onUpdateStatus,
  onSaveManualShipment,
  onToggleArchive,
  onConfirmTransfer,
  onDownloadLabel,
  onUploadPhoto,
  onOpenAttachment,
  onCreateHistoryLink,
  refreshing,
  onRefresh,
}: OrderDetailViewProps) {
  const t = useT();
  const tone = order ? STATUS_TONE[order.status] : 'neutral';
  const canDeliver = order?.status === 'shipped';
  const canCancel = order ? !['delivered', 'cancelled'].includes(order.status) : false;

  if (loading) return <ScreenSkeleton title={false} cards={6} />;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
        <Pressable onPress={onBack} hitSlop={10} style={{ padding: 4 }}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>{id ? shortId(id) : ''}</Text>
      </View>

      {order ? (
        <View style={{ gap: 14 }}>
          <Card>
            <StatusPill label={t(STATUS_LABEL_KEYS[order.status])} tone={tone} pinTopRight />
            <SectionLabel>{t('orderDetail.statusLabel')}</SectionLabel>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{shortId(order.id)}</Text>
          </Card>

          <Card>
            <SectionLabel>{t('orderDetail.actions')}</SectionLabel>
            <View style={{ gap: 10 }}>
              {canDeliver ? (
                <Button variant="success" icon={CheckCircle2} onPress={() => onUpdateStatus('delivered')}>
                  {t('orderDetail.markDelivered')}
                </Button>
              ) : null}
              {canCancel ? (
                <Button variant="danger" icon={XCircle} onPress={() => onUpdateStatus('cancelled')}>
                  {t('orderDetail.cancelOrder')}
                </Button>
              ) : null}
              {order.paymentMethod === 'bank_transfer' && order.status === 'pending' ? (
                <Button variant="blue" icon={CheckCircle2} onPress={onConfirmTransfer} disabled={confirmingTransfer}>
                  {t('orderDetail.confirmTransfer')}
                </Button>
              ) : null}
              <Button variant="dashed" icon={Camera} onPress={onUploadPhoto} disabled={uploadingPhoto}>
                {t('orderDetail.uploadPhoto')}
              </Button>
              <Button variant="light" icon={Inbox} onPress={onToggleArchive} disabled={archiving}>
                {order.isArchived ? t('orderDetail.restore') : t('orderDetail.archive')}
              </Button>
            </View>
          </Card>

          <Card>
            <SectionLabel icon={UserIcon}>{t('orderDetail.recipient')}</SectionLabel>
            <Row icon={UserIcon} label={t('orderDetail.name')} value={order.address.recipientName} />
            <Divider />
            <Row icon={Phone} label={t('orderDetail.phone')} value={order.address.phone || '-'} />
            <Divider />
            <Row icon={MapPin} label={t('orderDetail.address')} value={`${order.address.street}`} />
            <Divider />
            <Row icon={Building2} label={t('orderDetail.city')} value={order.address.city} />
            <Divider />
            <Row icon={MapIcon} label={t('orderDetail.province')} value={order.address.province} />
            <Divider />
            <Row icon={Mail} label={t('orderDetail.postal')} value={order.address.postalCode || '-'} />
          </Card>

          {isOwner && HISTORY_LINK_STATUSES.includes(order.status) ? (
            <Card>
              <SectionLabel icon={History}>{t('orderDetail.historyTitle')}</SectionLabel>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
                {t('orderDetail.historyDesc')}
              </Text>
              {historyLinkUrl ? (
                <View style={{ marginTop: 10, gap: 10 }}>
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: '#F6F3EC',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Link2 size={13} color={colors.muted} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={{ color: colors.green, fontWeight: '700', fontSize: 12.5 }}
                      >
                        {historyLinkUrl}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        Share.share({ message: historyLinkUrl }).catch(() =>
                          Alert.alert(t('common.failed'), t('orderLinks.shareFailed')),
                        )
                      }
                      hitSlop={8}
                    >
                      <Copy size={14} color={colors.muted} />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <Button
                    variant="light"
                    icon={History}
                    onPress={onCreateHistoryLink}
                    disabled={creatingHistoryLink}
                  >
                    {t('orderDetail.historyCta')}
                  </Button>
                </View>
              )}
            </Card>
          ) : null}

          <Card>
            <SectionLabel icon={Package}>{t('orderDetail.products')}</SectionLabel>
            {order.items.map((item) => (
              <View key={`${item.productId}-${item.sku ?? ''}`} style={{ flexDirection: 'row', gap: 10, paddingVertical: 6 }}>
                <View style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  backgroundColor: '#F1ECDE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontWeight: '800', fontSize: 11.5, color: colors.text }}>{item.quantity}x</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{item.productName}</Text>
                  <Text style={{ marginTop: 2, color: colors.muted, fontSize: 11 }}>
                    {formatIDR(item.price)} {t('orderDetail.perItem')}
                  </Text>
                </View>
                <Text style={{ fontWeight: '700', fontSize: 12.5, color: colors.text }}>{formatIDR(item.price * item.quantity)}</Text>
              </View>
            ))}
            <Divider />
            <Row label={t('orderDetail.subtotal')} value={formatIDR(order.subtotal)} />
            <Row
              label={`${t('orderDetail.shippingLabel')}${order.deliveryOption?.courierName ? ` (${order.deliveryOption.courierName})` : ''}`}
              value={formatIDR(order.deliveryFee)}
            />
            {order.promoDiscount ? <Row label={t('orderDetail.discount')} value={`- ${formatIDR(order.promoDiscount)}`} /> : null}
            <Divider />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{t('orderDetail.total')}</Text>
              <Text style={{ fontSize: 15.5, fontWeight: '800', color: colors.text }}>{formatIDR(order.total)}</Text>
            </View>
          </Card>

          <Card>
            <SectionLabel icon={Package}>{t('orderDetail.shipping')}</SectionLabel>
            {order.trackingNumber ? (
              <View>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{t('orderDetail.trackingNumber')}</Text>
                <Text selectable style={{ marginTop: 3, fontSize: 14, fontWeight: '700', color: colors.text }}>
                  {order.trackingNumber}
                </Text>
                <Text style={{ marginTop: 4, color: colors.muted, fontSize: 12 }}>
                  {order.deliveryOption?.courierName} · {order.deliveryOption?.serviceName}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <InfoBanner tone="warn" icon={Clock}>{t('orderDetail.noTracking')}</InfoBanner>
                <Field label={t('orderDetail.courier')} value={courierName} onChangeText={onCourierNameChange} placeholder="JNE" />
                <Field label={t('orderDetail.trackingField')} value={trackingNumber} onChangeText={onTrackingNumberChange} placeholder="JP123..." />
                <Button variant="green" onPress={onSaveManualShipment} disabled={savingManualShipment} icon={CheckCircle2}>
                  {t('orderDetail.saveTracking')}
                </Button>
              </View>
            )}
            <View style={{ marginTop: 12 }}>
              <Button variant="amber" icon={Download} onPress={onDownloadLabel} disabled={downloadingLabel}>
                {t('orderDetail.downloadLabel')}
              </Button>
            </View>
          </Card>

          <Card>
            <SectionLabel icon={FileText}>{t('orderDetail.manualStatus')}</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {orderStatuses.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === order.status ? 'green' : 'light'}
                  onPress={() => onUpdateStatus(status)}
                >
                  {t(STATUS_LABEL_KEYS[status])}
                </Button>
              ))}
            </View>
          </Card>

          {order.attachments?.length ? (
            <Card>
              <SectionLabel icon={Camera}>{t('orderDetail.attachments')}</SectionLabel>
              <View style={{ gap: 8 }}>
                {order.attachments.map((attachment) => (
                  <Pressable
                    key={attachment.id}
                    onPress={() => onOpenAttachment(attachment.url)}
                    style={({ pressed }) => [{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      opacity: pressed ? 0.75 : 1,
                    }]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 12.5 }} numberOfLines={1}>
                        {attachment.filename}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{formatDate(attachment.uploadedAt)}</Text>
                    </View>
                    <ExternalLink size={15} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          <Card>
            <SectionLabel icon={Clock}>{t('orderDetail.info')}</SectionLabel>
            <Row icon={Clock} label={t('orderDetail.created')} value={formatDate(order.createdAt)} />
            <Divider />
            <Row icon={RotateCw} label={t('orderDetail.updated')} value={formatDate(order.updatedAt)} />
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
