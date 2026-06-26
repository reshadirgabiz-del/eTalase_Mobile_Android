import {
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Inbox,
  Mail,
  Map as MapIcon,
  MapPin,
  Package,
  Phone,
  RotateCw,
  User as UserIcon,
  XCircle,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
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
  refreshing?: boolean;
  onRefresh?: () => void;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Diterima',
  cancelled: 'Dibatalkan',
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
  refreshing,
  onRefresh,
}: OrderDetailViewProps) {
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
            <StatusPill label={STATUS_LABEL[order.status]} tone={tone} pinTopRight />
            <SectionLabel>Status Pesanan</SectionLabel>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{shortId(order.id)}</Text>
          </Card>

          <Card>
            <SectionLabel>Aksi</SectionLabel>
            <View style={{ gap: 10 }}>
              {canDeliver ? (
                <Button variant="success" icon={CheckCircle2} onPress={() => onUpdateStatus('delivered')}>
                  Tandai Diterima
                </Button>
              ) : null}
              {canCancel ? (
                <Button variant="danger" icon={XCircle} onPress={() => onUpdateStatus('cancelled')}>
                  Batalkan Pesanan
                </Button>
              ) : null}
              {order.paymentMethod === 'bank_transfer' && order.status === 'pending' ? (
                <Button variant="blue" icon={CheckCircle2} onPress={onConfirmTransfer} disabled={confirmingTransfer}>
                  Konfirmasi Transfer
                </Button>
              ) : null}
              <Button variant="dashed" icon={Camera} onPress={onUploadPhoto} disabled={uploadingPhoto}>
                Upload Foto Bukti
              </Button>
              <Button variant="light" icon={Inbox} onPress={onToggleArchive} disabled={archiving}>
                {order.isArchived ? 'Pulihkan Pesanan' : 'Arsipkan Pesanan'}
              </Button>
            </View>
          </Card>

          <Card>
            <SectionLabel icon={UserIcon}>Penerima</SectionLabel>
            <Row icon={UserIcon} label="Nama" value={order.address.recipientName} />
            <Divider />
            <Row icon={Phone} label="Telepon" value={order.address.phone || '-'} />
            <Divider />
            <Row icon={MapPin} label="Alamat" value={`${order.address.street}`} />
            <Divider />
            <Row icon={Building2} label="Kota" value={order.address.city} />
            <Divider />
            <Row icon={MapIcon} label="Provinsi" value={order.address.province} />
            <Divider />
            <Row icon={Mail} label="Kode Pos" value={order.address.postalCode || '-'} />
          </Card>

          <Card>
            <SectionLabel icon={Package}>Produk</SectionLabel>
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
                    {formatIDR(item.price)} / item
                  </Text>
                </View>
                <Text style={{ fontWeight: '700', fontSize: 12.5, color: colors.text }}>{formatIDR(item.price * item.quantity)}</Text>
              </View>
            ))}
            <Divider />
            <Row label="Subtotal" value={formatIDR(order.subtotal)} />
            <Row
              label={`Ongkir${order.deliveryOption?.courierName ? ` (${order.deliveryOption.courierName})` : ''}`}
              value={formatIDR(order.deliveryFee)}
            />
            {order.promoDiscount ? <Row label="Diskon" value={`- ${formatIDR(order.promoDiscount)}`} /> : null}
            <Divider />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Total</Text>
              <Text style={{ fontSize: 15.5, fontWeight: '800', color: colors.text }}>{formatIDR(order.total)}</Text>
            </View>
          </Card>

          <Card>
            <SectionLabel icon={Package}>Pengiriman</SectionLabel>
            {order.trackingNumber ? (
              <View>
                <Text style={{ color: colors.muted, fontSize: 11 }}>Nomor Resi</Text>
                <Text selectable style={{ marginTop: 3, fontSize: 14, fontWeight: '700', color: colors.text }}>
                  {order.trackingNumber}
                </Text>
                <Text style={{ marginTop: 4, color: colors.muted, fontSize: 12 }}>
                  {order.deliveryOption?.courierName} · {order.deliveryOption?.serviceName}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <InfoBanner tone="warn" icon={Clock}>Belum ada nomor resi</InfoBanner>
                <Field label="Kurir" value={courierName} onChangeText={onCourierNameChange} placeholder="JNE" />
                <Field label="Nomor resi" value={trackingNumber} onChangeText={onTrackingNumberChange} placeholder="JP123..." />
                <Button variant="green" onPress={onSaveManualShipment} disabled={savingManualShipment} icon={CheckCircle2}>
                  Simpan Resi
                </Button>
              </View>
            )}
            <View style={{ marginTop: 12 }}>
              <Button variant="amber" icon={Download} onPress={onDownloadLabel} disabled={downloadingLabel}>
                Download Label Pengiriman
              </Button>
            </View>
          </Card>

          <Card>
            <SectionLabel icon={FileText}>Ubah Status Manual</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {orderStatuses.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === order.status ? 'green' : 'light'}
                  onPress={() => onUpdateStatus(status)}
                >
                  {STATUS_LABEL[status]}
                </Button>
              ))}
            </View>
          </Card>

          {order.attachments?.length ? (
            <Card>
              <SectionLabel icon={Camera}>Foto / Lampiran</SectionLabel>
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
            <SectionLabel icon={Clock}>Info</SectionLabel>
            <Row icon={Clock} label="Dibuat" value={formatDate(order.createdAt)} />
            <Divider />
            <Row icon={RotateCw} label="Diperbarui" value={formatDate(order.updatedAt)} />
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
