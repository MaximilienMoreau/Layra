import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CREDIT_COSTS = {
  vectorize_image: 15,
} as const;

type Action = keyof typeof CREDIT_COSTS;

type CreditsState = {
  credits: number;
  canUse: (action: Action) => boolean;
  spend: (action: Action) => boolean;
  addCredits: (amount: number) => void;
};

const FREE_CREDITS = 500;

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      credits: FREE_CREDITS,

      canUse: (action) => get().credits >= CREDIT_COSTS[action],

      spend: (action) => {
        const cost = CREDIT_COSTS[action];
        if (get().credits < cost) return false;
        set((s) => ({ credits: s.credits - cost }));
        return true;
      },

      addCredits: (amount) =>
        set((s) => ({ credits: Math.min(s.credits + amount, FREE_CREDITS) })),
    }),
    { name: "layra-credits" }
  )
);
