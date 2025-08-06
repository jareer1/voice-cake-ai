import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page as default */}
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          {/* Auth routes */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          {/* Public routes */}
          <Route path="/test" element={<PublicTest />} />
          {/* Protected app routes */}
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
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Voice Cloning</h2>
                <p className="text-muted-foreground">Feature coming soon...</p>
              </div>
            </AppLayout>
          } />
          <Route path="/settings" element={
            <AppLayout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p className="text-muted-foreground">Configure your platform settings...</p>
              </div>
            </AppLayout>
          } />
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
