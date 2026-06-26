import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { ProductDetailView } from '@/components/products/ProductDetailView';
import { useProducts } from '@/features/products/useProducts';
import { productsApi, uploadApi } from '@/lib/api';
import { useApiToken } from '@/lib/hooks';
import type { PaginatedResponse, Product } from '@/lib/types';
import { useAppStore } from '@/store/authStore';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useAppStore((state) => state.selectedStore)!;
  const getToken = useApiToken();
  const queryClient = useQueryClient();
  const { products, toggleArchive } = useProducts();

  const product = useMemo<Product | undefined>(
    () => products.data?.data.find((item) => item.id === id),
    [products.data, id],
  );

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState('');

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setSku(product.sku ?? '');
    setPrice(String(product.price ?? ''));
    setDiscountedPrice(product.discountedPrice ? String(product.discountedPrice) : '');
    setStock(String(product.stock ?? ''));
    setDescription(product.description ?? '');
    const urls = [
      product.imageUrl,
      ...(product.images ?? []).map((image) => image.imageUrl),
    ].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index);
    setImageUrls(urls);
    setMainImageUrl(product.imageUrl || urls[0] || '');
  }, [product]);

  const buildImagePayload = (urls = imageUrls, main = mainImageUrl) => ({
    imageUrl: main || urls[0] || '',
    images: urls.map((url, index) => ({
      id: `${id}-image-${index}`,
      imageUrl: url,
      isThumbnail: url === (main || urls[0]),
      sortOrder: index,
    })),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const payload: Partial<Product> = {
        name: name.trim(),
        sku: sku.trim() || null,
        price: Number(price) || 0,
        discountedPrice: discountedPrice ? Number(discountedPrice) : null,
        stock: Number(stock) || 0,
        description: description.trim(),
        ...buildImagePayload(),
      };
      return productsApi.update(id, store.storeId, payload, token);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['products', store.storeId],
        (prev: PaginatedResponse<Product> | undefined) =>
          prev
            ? { ...prev, data: prev.data.map((item) => (item.id === updated.id ? updated : item)) }
            : prev,
      );
      Alert.alert('Berhasil', 'Perubahan produk disimpan.');
    },
    onError: (error) => Alert.alert('Gagal menyimpan', (error as Error).message),
  });

  const syncProductImages = async (nextUrls: string[], nextMain: string) => {
    const token = await getToken();
    return productsApi.update(id, store.storeId, buildImagePayload(nextUrls, nextMain) as Partial<Product>, token);
  };

  const uploadImagesMutation = useMutation({
    mutationFn: async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Izin galeri diperlukan untuk memilih gambar produk.');
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.86,
      });
      if (picked.canceled || picked.assets.length === 0) return null;
      const token = await getToken();
      const uploaded = await Promise.all(
        picked.assets.map(async (asset, index) => {
          const name = asset.fileName || `product-${id}-${Date.now()}-${index}.jpg`;
          const type = asset.mimeType || 'image/jpeg';
          const { url } = await uploadApi.image({ uri: asset.uri, name, type }, token);
          return url;
        }),
      );
      const nextUrls = [...imageUrls, ...uploaded].filter((url, index, all) => all.indexOf(url) === index);
      const nextMain = mainImageUrl || nextUrls[0] || '';
      const updated = await syncProductImages(nextUrls, nextMain);
      return { updated, nextUrls, nextMain };
    },
    onSuccess: (result) => {
      if (!result) return;
      setImageUrls(result.nextUrls);
      setMainImageUrl(result.nextMain);
      queryClient.setQueryData(
        ['products', store.storeId],
        (prev: PaginatedResponse<Product> | undefined) =>
          prev
            ? { ...prev, data: prev.data.map((item) => (item.id === result.updated.id ? result.updated : item)) }
            : prev,
      );
      Alert.alert('Berhasil', 'Gambar produk berhasil diupload.');
    },
    onError: (error) => Alert.alert('Gagal upload gambar', (error as Error).message),
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: async (url: string) => {
      const updated = await syncProductImages(imageUrls, url);
      return { updated, url };
    },
    onSuccess: ({ updated, url }) => {
      setMainImageUrl(url);
      queryClient.setQueryData(
        ['products', store.storeId],
        (prev: PaginatedResponse<Product> | undefined) =>
          prev
            ? { ...prev, data: prev.data.map((item) => (item.id === updated.id ? updated : item)) }
            : prev,
      );
      Alert.alert('Berhasil', 'Gambar utama produk diperbarui.');
    },
    onError: (error) => Alert.alert('Gagal mengubah gambar utama', (error as Error).message),
  });

  return (
    <ProductDetailView
      product={product}
      loading={products.isLoading}
      name={name}
      sku={sku}
      price={price}
      discountedPrice={discountedPrice}
      stock={stock}
      description={description}
      imageUrls={imageUrls}
      mainImageUrl={mainImageUrl}
      saving={updateMutation.isPending}
      uploadingImages={uploadImagesMutation.isPending || setPrimaryImageMutation.isPending}
      togglingArchive={false}
      onBack={() => router.back()}
      onNameChange={setName}
      onSkuChange={setSku}
      onPriceChange={setPrice}
      onDiscountedPriceChange={setDiscountedPrice}
      onStockChange={setStock}
      onDescriptionChange={setDescription}
      onUploadImages={() => uploadImagesMutation.mutate()}
      onSetMainImage={(url) => setPrimaryImageMutation.mutate(url)}
      onSave={() => updateMutation.mutate()}
      onToggleArchive={() => product && toggleArchive({ id: product.id, archived: product.isArchived })}
    />
  );
}
