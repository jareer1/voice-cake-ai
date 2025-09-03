import { useFinance } from "@/context/financeContext";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { hasActiveSubscription, subscriptionsLoaded, refreshSubscriptions, activeSubscriptions } = useFinance();
  const token = localStorage.getItem("authToken");
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasRefreshedFromPurchaseRef = useRef(false);
  const hasRefreshedFromDashboardRef = useRef(false);

  useEffect(() => {
    if (!subscriptionsLoaded) {
      console.log("ProtectedRoute: Subscriptions not loaded, refreshing...");
      refreshSubscriptions();
    }
  }, [subscriptionsLoaded, refreshSubscriptions]);

  // Force refresh subscriptions when coming from plan purchase (only once)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (location.state?.from === '/plan-purchase' && subscriptionsLoaded && !hasActiveSubscription && !hasRefreshedFromPurchaseRef.current && !isRefreshing) {
      console.log("ProtectedRoute: Coming from plan purchase, force refreshing subscriptions...");
      hasRefreshedFromPurchaseRef.current = true;
      setIsRefreshing(true);
      
      // Add a small delay to prevent rapid successive calls
      timeoutId = setTimeout(() => {
        refreshSubscriptions().finally(() => setIsRefreshing(false));
      }, 100);
    }
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [location.state?.from, subscriptionsLoaded, hasActiveSubscription, isRefreshing, refreshSubscriptions]);

  // Also refresh if we're on dashboard but have no active subscription (edge case, only once)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (location.pathname === '/dashboard' && subscriptionsLoaded && !hasActiveSubscription && !isRefreshing && !hasRefreshedFromDashboardRef.current) {
      console.log("ProtectedRoute: On dashboard but no active subscription, refreshing...");
      hasRefreshedFromDashboardRef.current = true;
      setIsRefreshing(true);
      
      // Add a small delay to prevent rapid successive calls
      timeoutId = setTimeout(() => {
        refreshSubscriptions().finally(() => setIsRefreshing(false));
      }, 100);
    }
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [location.pathname, subscriptionsLoaded, hasActiveSubscription, isRefreshing, refreshSubscriptions]);

  // Prevent infinite redirects by tracking redirect attempts
  useEffect(() => {
    const redirectCount = sessionStorage.getItem('redirectCount') || '0';
    const count = parseInt(redirectCount);
    
    if (count > 3) {
      console.error("ProtectedRoute: Too many redirects, clearing session and redirecting to signin");
      sessionStorage.removeItem('redirectCount');
      localStorage.removeItem("authToken");
      window.location.href = "/auth/signin";
      return;
    }
    
    if (location.pathname === '/plan-selection' && hasActiveSubscription) {
      sessionStorage.setItem('redirectCount', String(count + 1));
      console.log("ProtectedRoute: User has active subscription but on plan selection, will redirect to dashboard");
    }
  }, [location.pathname, hasActiveSubscription]);

  // Token check
  if (!token) {
    console.log("ProtectedRoute: No token, redirecting to signin");
    return <Navigate to="/auth/signin" replace state={{ from: location.pathname }} />;
  }

  // Wait for subscriptions to load or refresh to complete
  if (!subscriptionsLoaded || isRefreshing) {
    console.log("ProtectedRoute: Waiting for subscriptions to load/refresh...");
    return null;
  }

  // If user has active subscription but is on plan selection, redirect to dashboard
  if (location.pathname === '/plan-selection' && hasActiveSubscription) {
    console.log("ProtectedRoute: User has active subscription but on plan selection, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // Clear redirect count if user successfully reaches dashboard with active subscription
  if (location.pathname === '/dashboard' && hasActiveSubscription) {
    sessionStorage.removeItem('redirectCount');
  }

  // Allow access to inference pages even without subscription (temporary)
  if (location.pathname.startsWith('/inference')) {
    console.log("ProtectedRoute: Allowing access to inference page without subscription");
    return <>{children}</>;
  }

  // If we're on a protected route and have active subscription, render children
  if (hasActiveSubscription) {
    console.log("ProtectedRoute: Has active subscription, rendering children");
    return <>{children}</>;
  }

  // If no active subscription, go to plan selection
  console.log("ProtectedRoute: No active subscription, redirecting to plan-selection");
  return <Navigate to="/plan-selection" replace state={{ from: location.pathname }} />;
}


