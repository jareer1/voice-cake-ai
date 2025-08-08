import { useFinance } from "@/context/financeContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { hasActiveSubscription, subscriptionsLoaded, refreshSubscriptions } = useFinance();

  // Ensure we have attempted to load subscription state before deciding
  if (!subscriptionsLoaded) {
    // Trigger a refresh if needed
    refreshSubscriptions();
    return null;
  }

  if (!hasActiveSubscription) return <Navigate to="/plan-selection" replace />;
  return <>{children}</>;
}


