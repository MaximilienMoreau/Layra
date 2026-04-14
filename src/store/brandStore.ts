import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BrandKit = {
  id: string;
  name: string;
  colors: string[];
  fonts: { heading: string; body: string };
  logoUrl: string | null;
  locked: boolean;
};

type BrandState = {
  activeBrand: BrandKit;
  brands: BrandKit[];
  setActiveBrand: (brand: BrandKit) => void;
  updateActiveBrand: (patch: Partial<BrandKit>) => void;
  addBrand: (brand: BrandKit) => void;
  deleteBrand: (id: string) => void;
};

const defaultBrand: BrandKit = {
  id: "default",
  name: "Ma Marque",
  colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
  fonts: { heading: "Inter", body: "Inter" },
  logoUrl: null,
  locked: false,
};

export const useBrandStore = create<BrandState>()(
  persist(
    (set, get) => ({
      activeBrand: defaultBrand,
      brands: [defaultBrand],

      setActiveBrand: (brand) => set({ activeBrand: brand }),

      updateActiveBrand: (patch) => {
        const updated = { ...get().activeBrand, ...patch };
        const brands = get().brands.map((b) =>
          b.id === updated.id ? updated : b
        );
        set({ activeBrand: updated, brands });
      },

      addBrand: (brand) =>
        set((s) => ({ brands: [...s.brands, brand] })),

      deleteBrand: (id) =>
        set((s) => ({
          brands: s.brands.filter((b) => b.id !== id),
        })),
    }),
    { name: "layra-brand" }
  )
);
