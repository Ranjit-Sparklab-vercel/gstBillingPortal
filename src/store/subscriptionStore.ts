import { create } from "zustand";
import { Subscription, SubscriptionPlan, SubscriptionStatus } from "@/types";

interface SubscriptionState {
  subscriptions: Subscription[];
  getSubscription: (plan: SubscriptionPlan) => Subscription | null;
  isPlanActive: (plan: SubscriptionPlan) => boolean;
  setSubscriptions: (subscriptions: Subscription[]) => void;
  hasAccess: (plan: SubscriptionPlan) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  getSubscription: (plan: SubscriptionPlan) => {
    const subs = get().subscriptions;
    return subs.find((sub) => sub.plan === plan) || null;
  },
  isPlanActive: (plan: SubscriptionPlan) => {
    const sub = get().getSubscription(plan);
    if (!sub) return false;
    if (sub.status !== SubscriptionStatus.ACTIVE) return false;
    const expiryDate = new Date(sub.expiryDate);
    return expiryDate > new Date();
  },
  setSubscriptions: (subscriptions: Subscription[]) =>
    set({ subscriptions }),
  hasAccess: (plan: SubscriptionPlan) => {
    const state = get();
    // Check if user has the specific plan or combo plan
    return (
      state.isPlanActive(plan) || state.isPlanActive(SubscriptionPlan.COMBO)
    );
  },
}));
