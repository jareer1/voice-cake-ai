import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentTest from "./pages/AgentTest";
import Landing from "./pages/Landing";
import PublicTest from "./pages/PublicTest";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VoiceClone from "./pages/VoiceClone";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

// Helper function to detect if we're on the app subdomain
const isAppSubdomain = () => {
  const hostname = window.location.hostname;
  
  // For local development, check for specific paths or query params
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check if we're explicitly on app routes
    const path = window.location.pathname;
    return path.startsWith('/dashboard') || 
           path.startsWith('/agents') || 
           path.startsWith('/voice-clone') || 
           path.startsWith('/settings') ||
           path.startsWith('/auth');
  }
  
  return hostname.startsWith('app.');
};

// Component to handle subdomain redirects
const SubdomainRedirect = ({ to, isApp }: { to: string; isApp: boolean }) => {
  const currentHost = window.location.hostname;
  
  // Remove both 'app.' and 'www.' prefixes to get the main domain
  let mainDomain = currentHost.replace(/^(app\.|www\.)/, '');
  
  // If the domain still has www after removing app, remove it
  if (mainDomain.startsWith('www.')) {
    mainDomain = mainDomain.replace(/^www\./, '');
  }
  
  const protocol = window.location.protocol;
  
  if (isApp) {
    // Redirect to app subdomain
    window.location.href = `${protocol}//app.${mainDomain}${to}`;
  } else {
    // Redirect to main domain (without www)
    window.location.href = `${protocol}//${mainDomain}${to}`;
  }
  
  return <div>Redirecting...</div>;
};

const App = () => {
  const isApp = isAppSubdomain();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {isApp ? (
              // App subdomain routes (app.abc.com)
              <>
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Auth routes on app subdomain */}
                <Route path="/auth/signin" element={<SignIn />} />
                <Route path="/auth/signup" element={<SignUp />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                
                {/* App routes */}
                <Route path="/dashboard" element={
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                } />
                <Route path="/agents" element={
                  <AppLayout>
                    <Agents />
                  </AppLayout>
                } />
                <Route path="/agents/:id/test" element={
                  <AppLayout>
                    <AgentTest />
                  </AppLayout>
                } />
                <Route path="/voice-clone" element={
                  <AppLayout>
                    <VoiceClone />
                  </AppLayout>
                } />
                <Route path="/settings" element={
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                } />
                
                {/* Redirect landing page requests to main domain */}
                <Route path="/landing" element={<SubdomainRedirect to="/" isApp={false} />} />
                <Route path="/test" element={<SubdomainRedirect to="/test" isApp={false} />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </>
            ) : (
              // Main domain routes (abc.com)
              <>
                {/* Landing and marketing pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/landing" element={<Landing />} />
                
                {/* Public routes */}
                <Route path="/test" element={<PublicTest />} />
                
                {/* Redirect auth to app subdomain */}
                <Route path="/auth/signin" element={<SubdomainRedirect to="/auth/signin" isApp={true} />} />
                <Route path="/auth/signup" element={<SubdomainRedirect to="/auth/signup" isApp={true} />} />
                <Route path="/auth/forgot-password" element={<SubdomainRedirect to="/auth/forgot-password" isApp={true} />} />
                <Route path="/auth/reset-password" element={<SubdomainRedirect to="/auth/reset-password" isApp={true} />} />
                
                {/* Redirect app routes to app subdomain */}
                <Route path="/dashboard" element={<SubdomainRedirect to="/dashboard" isApp={true} />} />
                <Route path="/agents" element={<SubdomainRedirect to="/agents" isApp={true} />} />
                <Route path="/agents/:id/test" element={<SubdomainRedirect to={window.location.pathname} isApp={true} />} />
                <Route path="/voice-clone" element={<SubdomainRedirect to="/voice-clone" isApp={true} />} />
                <Route path="/settings" element={<SubdomainRedirect to="/settings" isApp={true} />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

