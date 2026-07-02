import { ArrowLeft, Boxes, CheckCircle2, FileText, Image as ImageIcon, Package, Star, Tag, Upload } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';
import {
  Button,
  Card,
  Field,
  Loading,
  Screen,
  SectionLabel,
  StatusPill,
  colors,
} from '@/components/ui';
import type { Product } from '@/lib/types';
import { useT } from '@/lib/i18n';

interface ProductDetailViewProps {
  product?: Product;
  loading: boolean;
  name: string;
  sku: string;
  price: string;
  discountedPrice: string;
  stock: string;
  description: string;
  imageUrls: string[];
  mainImageUrl: string;
  saving: boolean;
  uploadingImages: boolean;
  togglingArchive: boolean;
  onBack: () => void;
  onNameChange: (value: string) => void;
  onSkuChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onDiscountedPriceChange: (value: string) => void;
  onStockChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onUploadImages: () => void;
  onSetMainImage: (url: string) => void;
  onSave: () => void;
  onToggleArchive: () => void;
}

export function ProductDetailView({
  product,
  loading,
  name,
  sku,
  price,
  discountedPrice,
  stock,
  description,
  imageUrls,
  mainImageUrl,
  saving,
  uploadingImages,
  togglingArchive,
  onBack,
  onNameChange,
  onSkuChange,
  onPriceChange,
  onDiscountedPriceChange,
  onStockChange,
  onDescriptionChange,
  onUploadImages,
  onSetMainImage,
  onSave,
  onToggleArchive,
}: ProductDetailViewProps) {
  const t = useT();
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
        <Pressable onPress={onBack} hitSlop={10} style={{ padding: 4 }}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
          {t('productDetail.title')}
        </Text>
      </View>

      {loading && !product ? <Loading /> : null}
      {product ? (
        <View style={{ gap: 14 }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <StatusPill
              label={product.isActive ? t('products.statusActive') : t('products.statusInactive')}
              tone={product.isActive ? 'green' : 'neutral'}
              pinTopRight
            />
            <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
              <View style={{
                width: 96,
                alignSelf: 'stretch',
                backgroundColor: '#F1ECDE',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {(mainImageUrl || product.imageUrl) ? (
                  <Image
                    source={{ uri: mainImageUrl || product.imageUrl }}
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 96, height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <ImageIcon size={26} color={colors.muted} />
                )}
              </View>
              <View style={{ flex: 1, padding: 12, paddingTop: 32, gap: 4 }}>
                <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 18 }}>
                  {name || product.name}
                </Text>
                {sku ? <Text style={{ color: colors.muted, fontSize: 11 }}>{sku}</Text> : null}
              </View>
            </View>
          </Card>

          <Card>
            <SectionLabel icon={ImageIcon}>{t('productDetail.imagesSection')}</SectionLabel>
            <View style={{ gap: 10 }}>
              <Button variant="dashed" icon={Upload} onPress={onUploadImages} disabled={uploadingImages}>
                {t('productDetail.uploadImages')}
              </Button>
              {imageUrls.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {imageUrls.map((url, index) => {
                    const active = url === mainImageUrl || (!mainImageUrl && index === 0);
                    return (
                      <Pressable
                        key={`${url}-${index}`}
                        onPress={() => onSetMainImage(url)}
                        style={({ pressed }) => [{
                          width: 74,
                          gap: 6,
                          opacity: pressed ? 0.8 : 1,
                        }]}
                      >
                        <View style={{
                          width: 74,
                          height: 74,
                          borderRadius: 10,
                          overflow: 'hidden',
                          borderWidth: active ? 2 : 1,
                          borderColor: active ? colors.green : colors.line,
                          backgroundColor: '#F1ECDE',
                        }}>
                          <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {active ? <Star size={11} color={colors.green} /> : null}
                          <Text style={{ color: active ? colors.green : colors.muted, fontSize: 10.5, fontWeight: '700' }}>
                            {active ? t('productDetail.mainImage') : t('productDetail.pickImage')}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={{ color: colors.muted, fontSize: 12 }}>{t('productDetail.noImages')}</Text>
              )}
            </View>
          </Card>

          <Card>
            <SectionLabel icon={Tag}>{t('productDetail.infoSection')}</SectionLabel>
            <View style={{ gap: 12 }}>
              <Field label={t('productDetail.name')} value={name} onChangeText={onNameChange} placeholder={t('productDetail.namePlaceholder')} />
              <Field label={t('productDetail.sku')} value={sku} onChangeText={onSkuChange} placeholder="SKU-001" />
              <Field
                label={t('productDetail.description')}
                value={description}
                onChangeText={onDescriptionChange}
                placeholder={t('productDetail.descPlaceholder')}
                multiline
                numberOfLines={4}
                style={{ minHeight: 90, paddingTop: 10, textAlignVertical: 'top' }}
              />
            </View>
          </Card>

          <Card>
            <SectionLabel icon={Package}>{t('productDetail.priceStock')}</SectionLabel>
            <View style={{ gap: 12 }}>
              <Field
                label={t('productDetail.price')}
                value={price}
                onChangeText={onPriceChange}
                placeholder="0"
                keyboardType="numeric"
              />
              <Field
                label={t('productDetail.discountedPrice')}
                value={discountedPrice}
                onChangeText={onDiscountedPriceChange}
                placeholder="0"
                keyboardType="numeric"
              />
              <Field
                label={t('productDetail.stock')}
                value={stock}
                onChangeText={onStockChange}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </Card>

          <Card>
            <SectionLabel icon={FileText}>{t('productDetail.actions')}</SectionLabel>
            <View style={{ gap: 10 }}>
              <Button variant="green" icon={CheckCircle2} onPress={onSave} disabled={saving}>
                {t('productDetail.save')}
              </Button>
              <Button variant="light" icon={Boxes} onPress={onToggleArchive} disabled={togglingArchive}>
                {product.isArchived ? t('productDetail.restore') : t('productDetail.archive')}
              </Button>
            </View>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
