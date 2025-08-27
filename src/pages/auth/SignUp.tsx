import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bot } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { toast } from "sonner";

export default function SignUp() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match", { position: "top-right" });
      return;
    }

    setLoading(true);
    try {
      const res: any = await signup(formData.email, formData.email, formData.password);
      if (res && typeof res === "object" && "success" in res) {
        if (res.success) {
          setError(""); // Clear error so it doesn't show in red
          toast.success(res.message || "Account created successfully. Redirecting to login...", { position: "top-right" });
          window.setTimeout(() => navigate("/auth/signin"), 1200);
        } else {
          setError(""); // Don't show error in red, only use toast
          toast.error(res.message || "Signup failed", { position: "top-right" });
        }
      } else {
        setError("Signup failed");
        toast.error("Signup failed", { position: "top-right" });
      }
    } catch (err: any) {
      setError(""); // Don't show error in red, only use toast
      toast.error(err.message || "Signup failed", { position: "top-right" });
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
            <h1 className="text-4xl font-bold mb-6">Join Voice Cake</h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Create your account and start building amazing dashboards with our comprehensive toolkit and beautiful components.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
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
              <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
              <p className="text-gray-600 text-sm">Get started with your free account</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>



                {error && !loading && (
                  // Only show error in red if not already showing in toast
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                <Button type="submit" className="w-full btn-theme-gradient" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="text-center mt-6">
                <span className="text-sm text-gray-600">Already have an account? </span>
                <Link to="/auth/signin" className="text-sm text-theme-gradient hover:text-theme-gradient/80 font-medium">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
