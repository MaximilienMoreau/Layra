import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CREDIT_COSTS = {
  generate_design: 10,
  animate_design: 20,
  generate_video: 50,
  export_hd: 5,
} as const;

type Plan = "free" | "pro" | "team";

type CreditsState = {
  credits: number;
  plan: Plan;
  totalUsed: number;
  canUse: (action: keyof typeof CREDIT_COSTS) => boolean;
  spend: (action: keyof typeof CREDIT_COSTS) => boolean;
  addCredits: (amount: number) => void;
  setPlan: (plan: Plan) => void;
};

const PLAN_CREDITS: Record<Plan, number> = {
  free: 500,
  pro: 3000,
  team: Infinity,
};

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      credits: 500,
      plan: "free",
      totalUsed: 0,

      canUse: (action) => {
        if (get().plan === "team") return true;
        return get().credits >= CREDIT_COSTS[action];
      },

      spend: (action) => {
        const cost = CREDIT_COSTS[action];
        if (get().plan === "team") {
          set((s) => ({ totalUsed: s.totalUsed + cost }));
          return true;
        }
        if (get().credits < cost) return false;
        set((s) => ({
          credits: s.credits - cost,
          totalUsed: s.totalUsed + cost,
        }));
        return true;
      },

      addCredits: (amount) =>
        set((s) => ({ credits: Math.min(s.credits + amount, PLAN_CREDITS[s.plan]) })),

      setPlan: (plan) =>
        set({ plan, credits: PLAN_CREDITS[plan] === Infinity ? 999999 : PLAN_CREDITS[plan] }),
    }),
    { name: "layra-credits" }
  )
);
