import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinance, type SubscriptionPlan, type BotType } from "@/context/financeContext";

const botTypes: BotType[] = ["conversa", "empath"];

export default function PlanSelection() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { listPlans, activeSubscriptions, subscriptionsLoaded, refreshSubscriptions, hasActiveSubscription } = useFinance();
  const [plans, setPlans] = useState<Record<BotType, SubscriptionPlan[]>>({ conversa: [], empath: [] });
  const [loading, setLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const hasRefreshedRef = useRef(false);
  const selectedBotType = (params.get("bot") as BotType) || "conversa";

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const [conversa, empath] = await Promise.allSettled([
          listPlans("conversa"),
          listPlans("empath"),
        ]);
        
        // Handle the results, ensuring we always have arrays
        const conversaPlans = conversa.status === "fulfilled" ? conversa.value : [];
        const empathPlans = empath.status === "fulfilled" ? empath.value : [];
        
        setPlans({ conversa: conversaPlans, empath: empathPlans });
      } catch (error) {
        // Set empty arrays as fallback
        setPlans({ conversa: [], empath: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [listPlans]);

  // Refresh subscriptions when component mounts to ensure we have latest state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Only refresh if subscriptions are loaded, not loading plans, and we haven't already refreshed
    if (subscriptionsLoaded && !loading && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      
      // Add a small delay to prevent rapid successive calls
      timeoutId = setTimeout(() => {
        refreshSubscriptions();
      }, 100);
    }
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [subscriptionsLoaded, loading, refreshSubscriptions]);

  // Handle redirect when subscription status changes (only once)
  useEffect(() => {
    if (hasActiveSubscription && !hasRedirected) {
      setHasRedirected(true);
      navigate("/dashboard", { replace: true });
    }
  }, [hasActiveSubscription, hasRedirected, navigate]);

  const currentPlans = useMemo(() => {
    const plansForBot = plans[selectedBotType];
    return Array.isArray(plansForBot) ? plansForBot : [];
  }, [plans, selectedBotType]);

  const handleSelect = (plan: SubscriptionPlan) => {
    navigate(`/plan-purchase?planId=${plan.id}&bot=${plan.bot_type}`);
  };

  // Find active subscription for selected bot type
  const activeSub = activeSubscriptions[selectedBotType];

  // Show loading state while refreshing subscriptions
  if (hasActiveSubscription === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-4 mb-10">
          <Badge variant="outline" className="mx-auto">Choose Your Plan</Badge>
          <h1 className="text-3xl sm:text-4xl font-noto-serif-bold">Select a VoiceCake plan</h1>
          <div className="flex justify-center gap-2">
            {botTypes.map((bt) => (
              <Button
                key={bt}
                variant={bt === selectedBotType ? "default" : "outline"}
                onClick={() => setParams({ bot: bt })}
                className={bt === selectedBotType ? "btn-theme-gradient" : ""}
              >
                {bt === "conversa" ? "VoiceCake Conversa" : "VoiceCake Empath"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-56 animate-pulse" />
          ))}
          {!loading && currentPlans.map((plan) => {
            const isSubscribed = activeSub && activeSub.plan_id === plan.id && activeSub.is_active;
            return (
              <Card key={plan.id} className="hover:shadow-md transition-all">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm">{plan.minutes.toLocaleString()} minutes • 30 days</p>
                  </div>
                  <div className="text-3xl font-bold">${plan.price}</div>
                  <Button
                    className="w-full btn-theme-gradient"
                    onClick={() => handleSelect(plan)}
                  >
                    Select {plan.name}
                  </Button>
                  {isSubscribed && (
                    <div className="mt-4">
                      <Card className="border border-yellow-400 bg-yellow-50">
                        <CardContent className="p-2 text-center">
                          <div className="text-sm font-semibold text-yellow-700">You already have an active subscription for this plan.</div>
                          <div className="mt-1 text-xs text-yellow-700">
                            Plan: <span className="font-bold">{activeSub.plan?.name}</span> • {activeSub.minutes_left.toLocaleString()} min left • Expires: {new Date(activeSub.expires_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}


