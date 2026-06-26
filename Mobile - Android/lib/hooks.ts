import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';

export function useApiToken() {
  const { getToken } = useAuth();
  return useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sesi tidak valid. Silakan login ulang.');
    return token;
  }, [getToken]);
}
