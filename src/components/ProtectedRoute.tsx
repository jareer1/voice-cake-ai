import { useFinance } from "@/context/financeContext";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { hasActiveSubscription, subscriptionsLoaded, refreshSubscriptions } = useFinance();
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!subscriptionsLoaded) {
      refreshSubscriptions();
    }
  }, [subscriptionsLoaded, refreshSubscriptions]);

  // Token check
  if (!token) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Wait for subscriptions to load
  if (!subscriptionsLoaded) {
    return null;
  }

  // If no active subscription, go to plan selection
  if (!hasActiveSubscription) {
    return <Navigate to="/plan-selection" replace />;
  }

  return <>{children}</>;
}


