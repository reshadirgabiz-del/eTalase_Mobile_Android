import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StoreAccess } from '@/lib/types';

interface AppState {
  selectedStore: StoreAccess | null;
  authUserId: string | null;
  setSelectedStore: (store: StoreAccess | null) => void;
  setAuthUserId: (userId: string | null) => void;
  clear: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedStore: null,
      authUserId: null,
      setSelectedStore: (selectedStore) => set({ selectedStore }),
      setAuthUserId: (authUserId) => set({ authUserId }),
      clear: () => set({ selectedStore: null, authUserId: null }),
    }),
    {
      name: 'etalase-mobile-state',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
