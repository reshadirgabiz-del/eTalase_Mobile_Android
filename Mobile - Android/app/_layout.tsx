import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { tokenCache } from '@/lib/clerkTokenCache';
import { BrandedLoading, colors } from '@/components/ui';
import { useAppStore } from '@/store/authStore';

function AuthGate() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();
  const authUserId = useAppStore((state) => state.authUserId);
  const setAuthUserId = useAppStore((state) => state.setAuthUserId);
  const clearAppStore = useAppStore((state) => state.clear);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      queryClient.clear();
      clearAppStore();
      return;
    }
    if (authUserId && authUserId !== userId) {
      queryClient.clear();
      clearAppStore();
    }
    if (userId && authUserId !== userId) {
      setAuthUserId(userId);
    }
  }, [authUserId, clearAppStore, isLoaded, isSignedIn, queryClient, setAuthUserId, userId]);

  useEffect(() => {
    if (!isLoaded) return;
    const first = segments[0] as string | undefined;
    const publicRoute = first === 'login' || first === 'auth' || first === 'how-to-login';
    if (!isSignedIn && !publicRoute) router.replace('/login');
    if (isSignedIn && publicRoute) router.replace('/store-select' as never);
  }, [isLoaded, isSignedIn, router, segments]);

  if (!isLoaded) {
    return <BrandedLoading />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="how-to-login" />
      <Stack.Screen name="store-select" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return <BrandedLoading />;
  }

  if (!publishableKey) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          Konfigurasi login belum tersedia.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AuthGate />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
