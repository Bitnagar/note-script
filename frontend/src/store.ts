import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of your state and actions
interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

interface FileUrlState {
  fileUrlMap: Record<string, string>;
  setFileUrl: (docId: string, url: string) => void;
  activeDocId: string | null;
  setActiveDocId: (docId: string | null) => void;
  fileFromSupabase: string | null;
  setFileFromSupabase: (url: string | null) => void;
}

// Create the store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token: string) => set({ token }),
      logout: () => set({ token: null }),
    }),
    {
      name: 'auth-storage', // name of the item in storage (must be unique)
    }
  )
);

export const useFileUrlStore = create<FileUrlState>()(
  persist(
    (set) => ({
      fileUrlMap: {},
      setFileUrl: (docId: string, url: string) =>
        set((state) => ({
          fileUrlMap: { ...state.fileUrlMap, [docId]: url },
        })),
      activeDocId: null,
      setActiveDocId: (docId: string | null) => set({ activeDocId: docId }),
      fileFromSupabase: null,
      setFileFromSupabase: (url: string | null) =>
        set({ fileFromSupabase: url }),
    }),
    {
      name: 'file-url-storage', // name of the item in storage (must be unique)
    }
  )
);
