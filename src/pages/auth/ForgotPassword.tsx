import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
      toast.success("Password reset email sent successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
              <h1 className="text-4xl font-bold mb-6">Check Your Email</h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                We've sent password reset instructions to your email address. Please check your inbox and follow the link.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Success Message */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sent!</h2>
                  <p className="text-gray-600 mb-6">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      variant="outline" 
                      className="w-full"
                    >
                      Resend Email
                    </Button>
                    <Link to="/auth/signin">
                      <Button variant="ghost" className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-bold mb-6">Reset Password</h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Reset Form */}
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
              <CardTitle className="text-2xl font-bold text-gray-900">Forgot Password</CardTitle>
              <p className="text-gray-600 text-sm">Enter your email to reset your password</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Enter your email address"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-theme-gradient"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <div className="text-center mt-6">
                <Link to="/auth/signin" className="inline-flex items-center text-sm text-theme-gradient hover:text-theme-gradient/80">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
