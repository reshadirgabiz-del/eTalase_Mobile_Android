import { CameraView } from 'expo-camera';
import { Link } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, colors, Field, Screen } from '@/components/ui';

interface LoginViewProps {
  code: string;
  loading: boolean;
  scannerOpen: boolean;
  onCodeChange: (value: string) => void;
  onSubmitCode: () => void;
  onOpenScanner: () => void;
  onCloseScanner: () => void;
  onScanQr: (data: string) => void;
}

export function LoginView({
  code,
  loading,
  scannerOpen,
  onCodeChange,
  onSubmitCode,
  onOpenScanner,
  onCloseScanner,
  onScanQr,
}: LoginViewProps) {
  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Image source={require('../../UI:UX/assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.mobileBadge}>
            <Text style={styles.mobileBadgeText}>MOBILE</Text>
          </View>
        </View>
        <Text style={styles.tagline}>Kelola toko Anda dengan mudah</Text>
      </View>

      <Card style={styles.loginCard}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Masuk ke akun Anda</Text>
          <Link href={'/how-to-login' as never} style={styles.help}>Cara login?</Link>
        </View>
        <Text style={styles.copy}>
          Buka Akun, Pengaturan Akun, Aplikasi Mobile, lalu klik "Buka di Aplikasi Mobile".
        </Text>
        <View style={{ marginTop: 18, gap: 14 }}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenScanner}
            disabled={loading}
            style={({ pressed }) => [styles.scanButton, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
          >
            <Camera size={23} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scan QR dari Web</Text>
          </Pressable>
          <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>atau masukkan kode</Text><View style={styles.line} /></View>
          <View style={styles.codeRow}>
            <View style={{ flex: 1 }}>
              <Field
                value={code}
                onChangeText={(value) => onCodeChange(value.toUpperCase())}
                autoCapitalize="characters"
                maxLength={8}
                placeholder="ABC123"
                style={styles.codeInput}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onSubmitCode}
              disabled={loading || !code.trim()}
              style={({ pressed }) => [styles.submitButton, pressed && { opacity: 0.85 }, (!code.trim() || loading) && styles.submitDisabled]}
            >
              <Text style={styles.submitButtonText}>Masuk</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Developed by</Text>
        <Image source={require('../../UI:UX/assets/logo.png')} style={styles.footerLogo} resizeMode="contain" />
      </View>

      <Modal visible={scannerOpen} animationType="slide">
        <View style={styles.scanner}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => onScanQr(data)}
          />
          <View style={styles.scannerTop}>
            <Pressable style={styles.closeButton} onPress={onCloseScanner}>
              <X size={20} color={colors.text} />
              <Text style={styles.closeText}>Tutup</Text>
            </Pressable>
          </View>
          <View style={styles.scanBox} />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 110, marginBottom: 46 },
  logoWrap: { width: 248, height: 76 },
  logoImage: { width: 248, height: 76 },
  // ── Tune the MOBILE badge from here ───────────────────────────────────────
  // top:   negative → moves badge UP; positive → DOWN
  // right: negative → moves badge to the RIGHT (outside logoWrap); positive → INWARD
  mobileBadge: {
    position: 'absolute',
    top: -10,
    right: -16,
    backgroundColor: colors.text,
    borderRadius: 9,
    paddingHorizontal: 10,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  tagline: { marginTop: 16, fontSize: 14.5, color: colors.muted },
  loginCard: { borderRadius: 20, padding: 20 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  help: { color: colors.green, fontSize: 13.5, fontWeight: '500' },
  copy: { marginTop: 12, fontSize: 13.5, color: colors.muted, lineHeight: 21 },
  scanButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  scanButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { color: '#A8A096', fontSize: 12.5 },
  codeRow: { flexDirection: 'row', gap: 9 },
  codeInput: {
    flex: 1,
    minHeight: 50,
    textAlign: 'center',
    letterSpacing: 5,
    fontSize: 18,
    fontWeight: '500',
    borderRadius: 14,
    backgroundColor: '#F6F3EC',
  },
  submitButton: {
    width: 98,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { backgroundColor: '#AEB89E' },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  footerRow: { marginTop: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 14 },
  footerText: { fontSize: 12.5, color: '#B0A899' },
  footerLogo: { width: 78, height: 24 },
  scanner: { flex: 1, backgroundColor: '#000' },
  scannerTop: { position: 'absolute', top: 56, left: 20, right: 20 },
  closeButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeText: { color: colors.text, fontWeight: '700' },
  scanBox: {
    position: 'absolute',
    alignSelf: 'center',
    top: '32%',
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 24,
  },
});
