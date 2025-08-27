import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useFinance } from "../../context/financeContext";
import api from "@/pages/services/api";
import { toast } from "sonner";

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { hasActiveSubscription, subscriptionsLoaded, refreshSubscriptions } = useFinance();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberDevice: false
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use login from context, get response
      const res: any = await login(formData.username, formData.password);
      
      // Handle both old and new response formats
      const isSuccessResponse = res && typeof res === "object" && "success" in res;
      const responseData = isSuccessResponse ? res.data : res;
      const message = isSuccessResponse ? res.message : "Login successful";
      
      if (isSuccessResponse ? res.success : true) {
        // Store additional user data in localStorage (tokens are already stored by auth context)
        localStorage.setItem("userId", String(responseData.user.id));
        localStorage.setItem("username", responseData.user.username);
        localStorage.setItem("email", responseData.user.email);
        
        toast.success(message, {
          position: "top-right"
        });
        
        // After login, fetch subscriptions and navigate accordingly
        try {
          // First refresh subscriptions in context
          await refreshSubscriptions();
          
          // Wait a bit for state to update, then check and navigate
          setTimeout(async () => {
            const [conversaRes, empathRes] = await Promise.allSettled([
              api.get("/finance/subscription/conversa"),
              api.get("/finance/subscription/empath"),
            ]);
            
            let hasActive = false;
            
            // Check Conversa subscription (single object response)
            if (conversaRes.status === "fulfilled" && conversaRes.value.data) {
              const conversaSub = conversaRes.value.data;
              if (conversaSub.is_active && conversaSub.minutes_left > 0) {
                hasActive = true;
              }
            }
            
            // Check Empath subscription (single object response)
            if (!hasActive && empathRes.status === "fulfilled" && empathRes.value.data) {
              const empathSub = empathRes.value.data;
              if (empathSub.is_active && empathSub.minutes_left > 0) {
                hasActive = true;
              }
            }
            
            if (hasActive) {
              navigate("/dashboard");
            } else {
              navigate("/plan-selection");
            }
          }, 500);
        } catch (err) {
          console.error("Error fetching subscriptions:", err);
          setTimeout(() => navigate("/plan-selection"), 800);
        }
      } else {
        toast.error(res.message || "Login failed", {
          position: "top-right"
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed", {
        position: "top-right"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Dark */}
      <div className="hidden lg:flex lg:w-1/2 bg-theme-gradient relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">Welcome to Voice Cake</h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Voice Cake helps developers to build AI Agents with ease.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.svg" 
                alt="Voice Cake Logo" 
                className="w-12 h-12"
              />
              <span className="font-bold text-xl text-theme-gradient">Voice Cake</span>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src="/logo.svg" 
                  alt="Voice Cake Logo" 
                  className="w-12 h-12"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
              <p className="text-gray-600 text-sm">Your Admin Dashboard</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-700">Email or Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your email or username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="mt-1 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberDevice}
                      onCheckedChange={(checked) => handleInputChange("rememberDevice", checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Remember this device
                    </Label>
                  </div>
                  <Link to="/auth/forgot-password" className="text-sm text-theme-gradient hover:text-theme-gradient/80">
                    Forgot password?
                  </Link>
                </div>



                <Button type="submit" className="w-full btn-theme-gradient" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center mt-6">
                <span className="text-sm text-gray-600">New to Voice Cake? </span>
                <Link to="/auth/signup" className="text-sm text-theme-gradient hover:text-theme-gradient/80 font-medium">
                  Create an account
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
