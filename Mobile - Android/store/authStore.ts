import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StoreAccess } from '@/lib/types';

interface AppState {
  selectedStore: StoreAccess | null;
  authUserId: string | null;
  pushToken: string | null;
  pushStoreId: string | null;
  setSelectedStore: (store: StoreAccess | null) => void;
  setAuthUserId: (userId: string | null) => void;
  setPushRegistration: (token: string | null, storeId: string | null) => void;
  clear: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedStore: null,
      authUserId: null,
      pushToken: null,
      pushStoreId: null,
      setSelectedStore: (selectedStore) => set({ selectedStore }),
      setAuthUserId: (authUserId) => set({ authUserId }),
      setPushRegistration: (pushToken, pushStoreId) => set({ pushToken, pushStoreId }),
      clear: () => set({ selectedStore: null, authUserId: null, pushToken: null, pushStoreId: null }),
    }),
    {
      name: 'etalase-mobile-state',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
