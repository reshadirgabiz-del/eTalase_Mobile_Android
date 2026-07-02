import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, Globe, Info, QrCode, Smartphone, Store, UserCircle2 } from 'lucide-react-native';
import { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, InfoBanner, Screen, colors } from '@/components/ui';
import { useT, type TranslationKey } from '@/lib/i18n';

const STEPS: {
  icon: ComponentType<{ size?: number; color?: string }>;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}[] = [
  { icon: Globe, titleKey: 'howto.step1.title', bodyKey: 'howto.step1.body' },
  { icon: UserCircle2, titleKey: 'howto.step2.title', bodyKey: 'howto.step2.body' },
  { icon: Smartphone, titleKey: 'howto.step3.title', bodyKey: 'howto.step3.body' },
  { icon: QrCode, titleKey: 'howto.step4.title', bodyKey: 'howto.step4.body' },
  { icon: Store, titleKey: 'howto.step5.title', bodyKey: 'howto.step5.body' },
];

export default function HowToLoginScreen() {
  const router = useRouter();
  const t = useT();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 15.5, fontWeight: '700', color: colors.text, marginRight: 28 }}>
          {t('howto.headerTitle')}
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
          {t('howto.heroTitle')}
        </Text>
        <Text style={{ marginTop: 6, color: colors.muted, fontSize: 12.5, lineHeight: 18, textAlign: 'center', paddingHorizontal: 12 }}>
          {t('howto.heroBody')}
        </Text>
      </View>

      <Card style={{ padding: 14 }}>
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === STEPS.length - 1;
          return (
            <View key={step.titleKey} style={{ flexDirection: 'row', gap: 12 }}>
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
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{t(step.titleKey)}</Text>
                </View>
                <Text style={{ marginTop: 4, color: colors.muted, fontSize: 12, lineHeight: 17 }}>{t(step.bodyKey)}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      <InfoBanner tone="info" icon={Info}>
        {t('howto.info')}
      </InfoBanner>

      <Button
        variant="light"
        size="lg"
        fullWidth
        onPress={() => WebBrowser.openBrowserAsync('https://app.e-talase.com/dashboard/account')}
      >
        {t('howto.openWeb')}
      </Button>

      <Link href="/login" asChild>
        <Pressable>
          <Button size="lg" fullWidth>{t('howto.backToLogin')}</Button>
        </Pressable>
      </Link>
    </Screen>
  );
}
