import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useFinance, type SubscriptionPlan } from "@/context/financeContext";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";
import { stripePromise } from "@/config/stripe";
import CheckoutForm from "@/components/CheckoutForm";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PlanPurchase() {
  const query = useQuery();
  const navigate = useNavigate();
  const { listPlans, refreshSubscriptionsImmediate, hasActiveSubscription } = useFinance();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
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
      } catch (error) {
        console.error("Failed to load plan:", error);
        toast.error("Failed to load plan details");
      }
    };
    load();
  }, [planId, bot, listPlans]);

  const handleSuccess = async () => {
    toast.success("Purchase successful! Your subscription is now active.");
    
    // Refresh subscriptions in context to ensure latest state
    await refreshSubscriptionsImmediate();
    
    // Navigate to dashboard using React Router
    navigate("/dashboard");
  };

  const handleError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  // Show loading while checking subscription status
  if (hasActiveSubscription === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // If no token, show authentication required message
  const token = localStorage.getItem("authToken");
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to complete your purchase.
            </p>
            <button
              onClick={() => {
                const { protocol, host, hostname } = window.location;
                // Ensure no subdomain like app. in local or prod
                const [namePart, portPart] = host.split(":");
                const bareHost = namePart.replace(/^app\./, "");
                const finalHost = portPart ? `${bareHost}:${portPart}` : bareHost;
                window.location.href = `${protocol}//${finalHost}/auth/signin`;
              }}
              className="btn-theme-gradient px-6 py-2 rounded-md"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-xl mx-auto">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Complete Your Purchase</h1>
                <p className="text-muted-foreground text-sm">Secure payment powered by Stripe</p>
              </div>

              {plan ? (
                <div className="rounded-lg border p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{plan.name}</div>
                      <div className="text-muted-foreground text-sm">
                        VoiceCake {bot === "conversa" ? "Conversa" : "Empath"} Bot
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        {[
                          plan.tts_minutes_included > 0 && `${plan.tts_minutes_included.toLocaleString()} TTS min`,
                          plan.sts_minutes_included > 0 && `${plan.sts_minutes_included.toLocaleString()} STS min`,
                          plan.automations_included && plan.automations_included > 0 && `${plan.automations_included.toLocaleString()} automations`
                        ].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-600">${plan.total_price}</div>
                  </div>
                </div>
              ) : (
                <div className="h-24 rounded-md bg-muted animate-pulse" />
              )}

              <div className="space-y-2">
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="autoRenew" 
                    checked={autoRenew} 
                    onCheckedChange={(v) => setAutoRenew(Boolean(v))} 
                  />
                  <Label htmlFor="autoRenew">Enable auto-renewal for seamless service</Label>
                </div>
              </div>

              {plan && (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    plan={plan}
                    autoRenew={autoRenew}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </Elements>
              )}

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  30-day validity • Minutes deducted as you use
                </p>
                <p className="text-xs text-blue-600">
                  🔒 Your payment is secured by Stripe's industry-standard encryption
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


