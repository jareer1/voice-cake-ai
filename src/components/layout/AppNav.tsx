import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AppNav() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">Voice Cake</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-slate-900 hover:bg-clip-text hover:text-transparent transition-all duration-300">
              Features
            </a>
            <a href="#pricing" className="text-foreground hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-slate-900 hover:bg-clip-text hover:text-transparent transition-all duration-300">
              Pricing
            </a>
            <a href="#testimonials" className="text-foreground hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-slate-900 hover:bg-clip-text hover:text-transparent transition-all duration-300">
              Testimonials
            </a>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth/signin")}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 hover:border-slate-600"
            >
              Sign In
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1">
              <div className="w-full h-0.5 bg-foreground"></div>
              <div className="w-full h-0.5 bg-foreground"></div>
              <div className="w-full h-0.5 bg-foreground"></div>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-foreground hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-slate-900 hover:bg-clip-text hover:text-transparent transition-all duration-300">
                Features
              </a>
              <a href="#pricing" className="text-foreground hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-slate-900 hover:bg-clip-text hover:text-transparent transition-all duration-300">
                Pricing
              </a>
              <a href="#testimonials" className="text-foreground hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-slate-900 hover:bg-clip-text hover:text-transparent transition-all duration-300">
                Testimonials
              </a>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Dashboard
              </Button>
              <Button 
                variant="outline"
                size="sm" 
                className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 hover:border-slate-600"
                onClick={() => navigate("/auth/signin")}
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
