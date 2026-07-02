import { useSignIn } from '@clerk/clerk-expo';
import { useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { mobileAuthApi } from '@/lib/api';
import { t } from '@/lib/i18n';

export function getTicketFromLoginPayload(data: string) {
  const candidates = [data];
  try {
    candidates.push(decodeURIComponent(data));
  } catch {
    // Already decoded.
  }

  for (const candidate of candidates) {
    try {
      const ticket = new URL(candidate).searchParams.get('ticket');
      if (ticket) return ticket;
    } catch {
      // Fall through to custom scheme parsing.
    }

    const match = candidate.match(/[?&]ticket=([^&#]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);

    try {
      const parsed = Linking.parse(candidate);
      const ticket = parsed.queryParams?.ticket;
      if (typeof ticket === 'string') return ticket;
      if (Array.isArray(ticket) && typeof ticket[0] === 'string') return ticket[0];
    } catch {
      // Invalid QR payload.
    }
  }

  return null;
}

export function useMobileLogin() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const redeemingRef = useRef(false);

  const redeemTicket = useCallback(async (ticket: string) => {
    if (!isLoaded || redeemingRef.current) return;
    redeemingRef.current = true;
    setLoading(true);
    try {
      const result = await signIn.create({ strategy: 'ticket', ticket });
      if (!result.createdSessionId) throw new Error(t('alert.loginTicketFailed'));
      await setActive({ session: result.createdSessionId });
      router.replace('/store-select' as never);
    } catch (error) {
      Alert.alert(t('alert.loginFailedTitle'), (error as Error).message);
      redeemingRef.current = false;
    } finally {
      setLoading(false);
      setScannerOpen(false);
    }
  }, [isLoaded, router, setActive, signIn]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const ticket = url ? getTicketFromLoginPayload(url) : null;
      if (ticket) redeemTicket(ticket);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      const ticket = getTicketFromLoginPayload(url);
      if (ticket) redeemTicket(ticket);
    });
    return () => sub.remove();
  }, [redeemTicket]);

  const submitCode = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const { ticket } = await mobileAuthApi.exchangeCode(trimmed);
      await redeemTicket(ticket);
    } catch (error) {
      Alert.alert(t('alert.codeInvalidTitle'), (error as Error).message);
      setLoading(false);
      redeemingRef.current = false;
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(t('alert.cameraPermissionTitle'), t('alert.cameraPermissionBody'));
        return;
      }
    }
    setScannerOpen(true);
  };

  const handleQrData = (data: string) => {
    const ticket = getTicketFromLoginPayload(data);
    if (ticket) redeemTicket(ticket);
  };

  return {
    code,
    setCode,
    loading,
    scannerOpen,
    openScanner,
    closeScanner: () => setScannerOpen(false),
    submitCode,
    handleQrData,
  };
}
