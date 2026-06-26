import { useSignIn } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { Loading, Screen } from '@/components/ui';

export default function AuthCallbackScreen() {
  const { ticket } = useLocalSearchParams<{ ticket?: string }>();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!ticket) {
      router.replace('/login');
      return;
    }
    signIn.create({ strategy: 'ticket', ticket })
      .then((result) => setActive({ session: result.createdSessionId }))
      .then(() => router.replace('/store-select' as never))
      .catch((error) => {
        Alert.alert('Login gagal', (error as Error).message);
        router.replace('/login');
      });
  }, [isLoaded, router, setActive, signIn, ticket]);

  return (
    <Screen>
      <Loading />
    </Screen>
  );
}
