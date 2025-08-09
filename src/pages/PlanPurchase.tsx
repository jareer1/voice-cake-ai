import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useFinance, type SubscriptionPlan } from "@/context/financeContext";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";
import api from "./services/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Revolut test payment API
export async function revolutTestPayment(amountCents: number, currency: string = "EUR") {
  const res = await api.post(`/finance/revolut/test-payment?amount_cents=${amountCents}&currency=${currency}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (res.status !== 200) throw new Error("Payment failed");
  return res.data;
}

export default function PlanPurchase() {
  const query = useQuery();
  const navigate = useNavigate();
  const { listPlans, purchasePlan, refreshSubscriptions, hasActiveSubscription } = useFinance();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [counterparty, setCounterparty] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  const planId = Number(query.get("planId"));
  const bot = (query.get("bot") as "conversa" | "empath") || "conversa";

  // Redirect if user already has an active subscription (only once)
  useEffect(() => {
    if (hasActiveSubscription && !hasRedirected) {
      console.log("PlanPurchase: User already has active subscription, redirecting to dashboard");
      setHasRedirected(true);
      navigate("/dashboard", { replace: true });
    }
  }, [hasActiveSubscription, hasRedirected, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const plans = await listPlans(bot);
        const found = plans.find((p) => p.id === planId) || null;
        setPlan(found);
      } catch {
        // ignore
      }
    };
    load();
  }, [planId, bot, listPlans]);

  const appUrl = useMemo(() => "/dashboard", []);

  let token = localStorage.getItem("authToken");

  // Show loading while checking subscription status
  if (hasActiveSubscription === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Show redirect message if user already has subscription
  if (hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!token) {
      toast.info("Please sign in to complete your purchase.");
      const { protocol, host, hostname } = window.location;
      // Ensure no subdomain like app. in local or prod
      const [namePart, portPart] = host.split(":");
      const bareHost = namePart.replace(/^app\./, "");
      const finalHost = portPart ? `${bareHost}:${portPart}` : bareHost;
      window.location.href = `${protocol}//${finalHost}/auth/signin`;
      return;
    }
    if (!plan) return;
    setLoading(true);
    try {
      const res = await purchasePlan(plan.id, { counterparty, autoRenew });
      toast.success("Purchase successful, all set!");
      
      // Refresh subscriptions in context to ensure latest state
      await refreshSubscriptions();
      
      // Navigate to dashboard using React Router
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTestCardPayment = async () => {
    try {
      const result = await revolutTestPayment(1000, "EUR");
      if (result.success) {
        alert("Test payment successful! Order ID: " + result.order_id);
      } else {
        alert("Test payment failed. Status: " + result.status);
      }
    } catch (e: any) {
      alert("Payment error: " + (e?.message || "Unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-xl mx-auto">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Checkout</h1>
                <p className="text-muted-foreground text-sm">Complete your purchase via Revolut Open Banking</p>
              </div>

              {plan ? (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{plan.name} • {plan.minutes.toLocaleString()} min</div>
                      <div className="text-muted-foreground text-sm">VoiceCake {bot === "conversa" ? "Conversa" : "Empath"}</div>
                    </div>
                    <div className="text-2xl font-bold">${plan.price}</div>
                  </div>
                </div>
              ) : (
                <div className="h-24 rounded-md bg-muted animate-pulse" />
              )}

              <div className="space-y-2">
                <Label htmlFor="counterparty">Counterparty (Revolut Sandbox)</Label>
                <Input
                  id="counterparty"
                  placeholder="counterparty_id or IBAN"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                />
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="autoRenew" checked={autoRenew} onCheckedChange={(v) => setAutoRenew(Boolean(v))} />
                  <Label htmlFor="autoRenew">Enable auto-renew</Label>
                </div>
              </div>

              <Button className="w-full btn-theme-gradient" onClick={handlePurchase} disabled={!plan || loading}>
                {loading ? "Processing..." : "Pay with Revolut"}
              </Button>
              <Button variant="outline" size="xl" className="w-full mt-4" onClick={handleTestCardPayment}>
                Test Card Payment (Revolut Sandbox)
              </Button>
              <p className="text-xs text-muted-foreground text-center">30-day validity • Minutes deducted as you use</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


