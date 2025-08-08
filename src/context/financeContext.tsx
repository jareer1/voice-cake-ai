import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "@/pages/services/api";

export type BotType = "conversa" | "empath";

export interface SubscriptionPlan {
  id: number;
  name: string;
  bot_type: BotType;
  minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  expires_at: string;
  minutes_left: number;
  auto_renew: boolean;
  is_active: boolean;
  created_at: string;
  plan: SubscriptionPlan;
}

export interface UsageMeter {
  id: number;
  user_id: number;
  bot_type: BotType;
  stt_minutes?: number;
  tts_minutes?: number;
  llm_minutes?: number;
  empath_minutes?: number;
  updated_at: string;
}

export interface ApiKeyInfo {
  id?: number;
  user_id?: number;
  is_active?: boolean;
  created_at?: string;
  expires_at?: string | null;
  // When creating/rotating, backend may return raw api_key string separately
  api_key_raw?: string | null;
  scope?: string;
  preview?: string;
}

export interface WalletInfo {
  balance_cents: number;
  currency: string;
  premium_voice_surcharge_cents: number;
  updated_at: string;
}

type FinanceContextType = {
  // subscription state
  hasActiveSubscription: boolean;
  activeSubscriptions: Partial<Record<BotType, UserSubscription>>;
  refreshSubscriptions: () => Promise<void>;
  subscriptionsLoaded: boolean;

  // plans
  listPlans: (botType: BotType) => Promise<SubscriptionPlan[]>;

  // purchase
  purchasePlan: (planId: number, opts: { counterparty?: string; autoRenew?: boolean }) => Promise<{ subscription: UserSubscription; apiKeyRaw?: string | null }>;

  // usage
  getUsage: (botType: BotType) => Promise<UsageMeter>;
  meterUsage: (botType: BotType, usage: { stt?: number; tts?: number; llm?: number; empath?: number }) => Promise<UsageMeter>;

  // api keys
  getApiKey: () => Promise<ApiKeyInfo>;
  listApiKeys: (scope?: string) => Promise<ApiKeyInfo[]>;
  rotateApiKey: (scope: string) => Promise<ApiKeyInfo>;
  revokeApiKey: (key_id: number) => Promise<void>;

  // add-ons
  purchaseVoiceClone: () => Promise<void>;
  purchasePremiumVoice: () => Promise<void>;

  // wallet
  getWallet: () => Promise<WalletInfo>;
  topupWallet: (amount_cents: number) => Promise<WalletInfo>;
  setPremiumSurcharge: (cents_per_minute: number) => Promise<WalletInfo>;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSubscriptions, setActiveSubscriptions] = useState<Partial<Record<BotType, UserSubscription>>>({});
  const [subscriptionsLoaded, setSubscriptionsLoaded] = useState<boolean>(false);

  const hasActiveSubscription = useMemo(() => {
    return Boolean(activeSubscriptions.conversa || activeSubscriptions.empath);
  }, [activeSubscriptions]);

  const listPlans = useCallback(async (botType: BotType): Promise<SubscriptionPlan[]> => {
    const { data } = await api.get(`/finance/plans/${botType}`);
    return data as SubscriptionPlan[];
  }, []);

  const refreshSubscriptions = useCallback(async () => {
    try {
      const [conversaRes, empathRes] = await Promise.allSettled([
        api.get(`/finance/subscription/conversa`),
        api.get(`/finance/subscription/empath`),
      ]);

      const next: Partial<Record<BotType, UserSubscription>> = {};
      if (conversaRes.status === "fulfilled") next.conversa = conversaRes.value.data as UserSubscription;
      if (empathRes.status === "fulfilled") next.empath = empathRes.value.data as UserSubscription;
      setActiveSubscriptions(next);
    } catch (e) {
      // ignore
    }
    finally {
      setSubscriptionsLoaded(true);
    }
  }, []);

  const purchasePlan = useCallback(
    async (
      planId: number,
      opts: { counterparty?: string; autoRenew?: boolean } = {}
    ): Promise<{ subscription: UserSubscription; apiKeyRaw?: string | null }> => {
      const payload = {
        counterparty: opts.counterparty ?? "sandbox_counterparty",
        auto_renew: Boolean(opts.autoRenew),
      };
      const { data } = await api.post(`/finance/purchase/${planId}`, payload);
      const sub = data?.data?.subscription as UserSubscription;
      const rawKey = data?.data?.api_key as string | undefined;
      await refreshSubscriptions();
      return { subscription: sub, apiKeyRaw: rawKey ?? null };
    },
    [refreshSubscriptions]
  );

  const getUsage = useCallback(async (botType: BotType): Promise<UsageMeter> => {
    const { data } = await api.get(`/finance/usage/${botType}`);
    return data as UsageMeter;
  }, []);

  const meterUsage = useCallback(async (botType: BotType, usage: { stt?: number; tts?: number; llm?: number; empath?: number }): Promise<UsageMeter> => {
    const { data } = await api.post(`/finance/usage/${botType}`, usage);
    return (data?.data as UsageMeter) ?? data;
  }, []);

  const getApiKey = useCallback(async (): Promise<ApiKeyInfo> => {
    // keep for backward compatibility: get latest key (if any)
    const res = await api.get(`/finance/apikeys`);
    const items = res.data?.data as ApiKeyInfo[] | undefined;
    return (items && items[0]) || {};
  }, []);

  const listApiKeys = useCallback(async (scope?: string): Promise<ApiKeyInfo[]> => {
    const { data } = await api.get(`/finance/apikeys`, { params: { scope } });
    return (data?.data as ApiKeyInfo[]) || [];
  }, []);

  const rotateApiKey = useCallback(async (scope: string): Promise<ApiKeyInfo> => {
    const { data } = await api.post(`/finance/apikey/rotate`, null, { params: { scope } });
    const raw = data?.data?.api_key as string | undefined;
    return { api_key_raw: raw ?? null, id: data?.data?.id, scope } as ApiKeyInfo;
  }, []);

  const revokeApiKey = useCallback(async (key_id: number): Promise<void> => {
    await api.post(`/finance/apikey/revoke`, null, { params: { key_id } });
  }, []);

  const purchaseVoiceClone = useCallback(async (): Promise<void> => {
    await api.post(`/finance/voice-clone`);
  }, []);

  const purchasePremiumVoice = useCallback(async (): Promise<void> => {
    await api.post(`/finance/premium-voice`);
  }, []);

  const getWallet = useCallback(async (): Promise<WalletInfo> => {
    const { data } = await api.get(`/finance/wallet`);
    return data as WalletInfo;
  }, []);

  const topupWallet = useCallback(async (amount_cents: number): Promise<WalletInfo> => {
    const { data } = await api.post(`/finance/wallet/topup`, { amount_cents });
    return data as WalletInfo;
  }, []);

  const setPremiumSurcharge = useCallback(async (cents_per_minute: number): Promise<WalletInfo> => {
    const { data } = await api.post(`/finance/wallet/premium-toggle`, null, { params: { cents_per_minute } });
    return data as WalletInfo;
  }, []);

  useEffect(() => {
    // Attempt to pre-load subscriptions on mount if authenticated
    refreshSubscriptions();
  }, [refreshSubscriptions]);

  const value = useMemo<FinanceContextType>(
    () => ({
      hasActiveSubscription,
      activeSubscriptions,
      refreshSubscriptions,
      subscriptionsLoaded,
      listPlans,
      purchasePlan,
      getUsage,
      meterUsage,
      getApiKey,
      listApiKeys,
      rotateApiKey,
      revokeApiKey,
      purchaseVoiceClone,
      purchasePremiumVoice,
      getWallet,
      topupWallet,
      setPremiumSurcharge,
    }),
    [
      hasActiveSubscription,
      activeSubscriptions,
      refreshSubscriptions,
      subscriptionsLoaded,
      listPlans,
      purchasePlan,
      getUsage,
      meterUsage,
      getApiKey,
      listApiKeys,
      rotateApiKey,
      revokeApiKey,
      purchaseVoiceClone,
      purchasePremiumVoice,
      getWallet,
      topupWallet,
      setPremiumSurcharge,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
};


