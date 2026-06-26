import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, Globe, Info, QrCode, Smartphone, Store, UserCircle2 } from 'lucide-react-native';
import { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, InfoBanner, Screen, colors } from '@/components/ui';

const STEPS: { icon: ComponentType<{ size?: number; color?: string }>; title: string; body: string }[] = [
  {
    icon: Globe,
    title: 'Buka dasbor web',
    body: 'Login ke akun Anda di dasbor web melalui browser komputer atau HP.',
  },
  {
    icon: UserCircle2,
    title: 'Buka Akun',
    body: 'Di dasbor web, buka Akun, lalu pilih Pengaturan Akun.',
  },
  {
    icon: Smartphone,
    title: 'Buka Aplikasi Mobile',
    body: 'Masuk ke bagian Aplikasi Mobile, lalu klik "Buka di Aplikasi Mobile" untuk membuat QR login dan kode.',
  },
  {
    icon: QrCode,
    title: 'Scan QR atau masukkan kode',
    body: 'Kembali ke aplikasi ini, tap "Scan QR dari Web", lalu arahkan kamera ke QR di dasbor. Atau ketik kode 6 huruf yang tertera di bawah QR.',
  },
  {
    icon: Store,
    title: 'Pilih toko',
    body: 'Setelah login berhasil, pilih toko yang ingin Anda kelola.',
  },
];

export default function HowToLoginScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 15.5, fontWeight: '700', color: colors.text, marginRight: 28 }}>
          Cara Login
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
        <View style={{
          width: 66,
          height: 66,
          borderRadius: 18,
          backgroundColor: '#EFEAD9',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Smartphone size={28} color={colors.text} />
        </View>
        <Text style={{ marginTop: 14, fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
          Cara masuk ke e-Talase Mobile
        </Text>
        <Text style={{ marginTop: 6, color: colors.muted, fontSize: 12.5, lineHeight: 18, textAlign: 'center', paddingHorizontal: 12 }}>
          Aplikasi ini hanya bisa diakses oleh anggota toko yang sudah terdaftar di dasbor web.
        </Text>
      </View>

      <Card style={{ padding: 14 }}>
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === STEPS.length - 1;
          return (
            <View key={step.title} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: colors.text,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11.5 }}>{index + 1}</Text>
                </View>
                {!isLast ? <View style={{ flex: 1, width: 1.5, backgroundColor: colors.line, marginVertical: 4 }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Icon size={14} color={colors.text} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{step.title}</Text>
                </View>
                <Text style={{ marginTop: 4, color: colors.muted, fontSize: 12, lineHeight: 17 }}>{step.body}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      <InfoBanner tone="info" icon={Info}>
        QR dan kode login berlaku selama 10 menit. Jika kadaluarsa, klik "Buat kode baru" di dasbor web.
      </InfoBanner>

      <Button
        variant="light"
        size="lg"
        fullWidth
        onPress={() => WebBrowser.openBrowserAsync('https://app.e-talase.com/dashboard/account')}
      >
        Buka app.e-talase.com
      </Button>

      <Link href="/login" asChild>
        <Pressable>
          <Button size="lg" fullWidth>Kembali ke Halaman Login</Button>
        </Pressable>
      </Link>
    </Screen>
  );
}
