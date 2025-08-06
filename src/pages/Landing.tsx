import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Bot, 
  Play, 
  Mic, 
  MessageSquare, 
  Phone, 
  Zap, 
  Shield, 
  Users, 
  ArrowRight,
  Check,
  Star
} from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import AppNav from "@/components/layout/AppNav";

// Helper function to get the app subdomain URL
const getAppUrl = (path: string = '') => {
  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;
  
  // For local development
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return path;
  }
  
  // For production - redirect to app subdomain
  // Remove both 'app.' and 'www.' prefixes to get the main domain
  let mainDomain = currentHost.replace(/^(app\.|www\.)/, '');
  
  // If the domain still has www after removing app, remove it
  if (mainDomain.startsWith('www.')) {
    mainDomain = mainDomain.replace(/^www\./, '');
  }
  
  return `${protocol}//app.${mainDomain}${path}`;
};

export default function Landing() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleTestClick = () => {
    // Keep test on main domain for public access
    navigate("/test");
  };

  const handleDashboardClick = () => {
    const appUrl = getAppUrl('/dashboard');
    if (appUrl.startsWith('http')) {
      window.location.href = appUrl;
    } else {
      navigate(appUrl);
    }
  };

  const features = [
    {
      icon: Bot,
      title: "AI Voice Agents",
      description: "Create intelligent voice assistants that understand and respond naturally"
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel",
      description: "Deploy across WhatsApp, voice calls, and web platforms seamlessly"
    },
    {
      icon: Mic,
      title: "Voice Cloning",
      description: "Clone your voice or choose from premium voice options"
    },
    {
      icon: Shield,
      title: "Enterprise Ready",
      description: "Secure, scalable, and compliant with industry standards"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Customer Success Manager",
      company: "TechCorp",
      content: "Our customer response time improved by 80% with AI voice agents. Game-changer!",
      rating: 5
    },
    {
      name: "Mike Rodriguez", 
      role: "Operations Director",
      company: "StartupXYZ",
      content: "The voice cloning feature is incredible. Our customers love the personalized experience.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Head of Support",
      company: "Enterprise Inc",
      content: "Seamless integration across all our channels. Setup took less than 30 minutes.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "per month",
      description: "Perfect for small businesses",
      features: [
        "1 AI Agent",
        "1,000 minutes/month",
        "Basic voice options",
        "Web integration",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional", 
      price: "$99",
      period: "per month",
      description: "For growing businesses",
      features: [
        "5 AI Agents",
        "10,000 minutes/month",
        "Voice cloning",
        "All integrations",
        "Priority support",
        "Analytics dashboard"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large organizations",
      features: [
        "Unlimited agents",
        "Unlimited minutes",
        "Custom voice training",
        "White-label options",
        "Dedicated support",
        "SLA guarantee"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background font-roboto">
      {/* Navigation */}
      <AppNav />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative" style={{ backgroundColor: '#f7fff9' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <Badge variant="secondary" className="mx-auto">
                🚀 Now with Voice Cloning Technology
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-noto-serif-normal text-black leading-tight">
                Experience <span className="ultra-real-animated">ultra-real</span> voice conversations with unmatched speed, quality, and affordability.
              </h1>

              <p className="text-xl text-black/80 max-w-2xl mx-auto leading-relaxed">
                Launch <span className="font-semibold text-black">ultra-real</span> conversations in under 250 ms for just $0.11 per finished-audio minute (all-in). One endpoint, no Franken-stack, live in minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="default"
                  size="xl"
                  className="btn-theme-gradient font-semibold gap-2"
                  onClick={handleTestClick}
                >
                  <Play className="w-5 h-5" />
                  Try Agent for Free
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="font-semibold gap-2 text-black border-black/20 hover:bg-black/5"
                >
                  Watch Demo
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-black/60 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>5-minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Free trial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Test Agent Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="mx-auto">
                🎯 Test Drive
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-noto-serif-bold">
                Experience AI Voice Technology
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Try our customer support agent for free. No signup required - 
                just click and start talking to see the magic happen.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto glass border-border/50 hover:shadow-glow transition-all duration-500">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-theme-gradient rounded-full flex items-center justify-center animate-pulse-glow">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-noto-serif-bold">Customer Support AI</h3>
                  <p className="text-muted-foreground">
                    Ask about products, get help with orders, or test any customer service scenario
                  </p>
                </div>

                <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>Instant responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-success" />
                    <span>Natural conversation</span>
                  </div>
                </div>

                <Button
                  variant="gradient"
                  size="xl"
                  className="w-full max-w-md gap-2 font-semibold btn-theme-gradient hover:shadow-lg"
                  onClick={handleTestClick}
                >
                  <Play className="w-5 h-5" />
                  Start 5-Minute Free Test
                </Button>

                <p className="text-xs text-muted-foreground">
                  No account needed • Test for 5 minutes • Experience real AI conversation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-noto-serif-bold">
              Everything You Need to Build Voice AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Powerful features that make creating and managing AI voice agents simple and effective
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="text-center hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-theme-gradient rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-noto-serif-bold">
              Loved by Teams Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers are saying about their AI voice agents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.name}
                className="animate-fade-up hover:shadow-md transition-shadow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground italic">"{testimonial.content}"</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your needs. Start free, scale as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={plan.name}
                className={`relative hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-up ${
                  plan.popular ? 'ring-2 ring-slate-700 shadow-lg' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 badge-theme-gradient">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6 space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-xl">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                    <div className="space-y-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className={plan.popular ? "w-full btn-theme-gradient hover:shadow-lg" : "w-full"}
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing Comparison Table */}
          <div className="mt-20">
            <div className="text-center space-y-4 mb-12">
              <h3 className="text-2xl sm:text-3xl font-noto-serif-bold text-gray-700">
                Pricing Comparison
              </h3>
            </div>

            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left">
                        <span className="text-lg font-semibold text-gray-600">FEATURES</span>
                      </th>
                      <th className="px-6 py-4 text-center bg-teal-400">
                        <span className="text-lg font-bold text-white">VOICE CAKE</span>
                      </th>
                      <th className="px-6 py-4 text-center bg-gray-100">
                        <span className="text-lg font-semibold text-gray-600">VAPI / ELEVENLABS</span>
                      </th>
                      <th className="px-6 py-4 text-center bg-gray-100">
                        <span className="text-lg font-semibold text-gray-600">AMAZON / GOOGLE / AZURE</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">Unified Speech-to-Speech</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">Sub-250ms Latency</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">All-in-One Pricing</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">50+ Expressive Voices</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">Real-time Analytics</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">Emotion & Reasoning</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">WebRTC Streaming</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">No Hidden Fees</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">5 Free Minutes Monthly</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700 font-medium">Volume Discounts</td>
                      <td className="px-6 py-4 text-center bg-teal-50">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Check className="w-6 h-6 text-teal-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-500 text-xl">✕</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-theme-gradient">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-noto-serif-bold text-white">
            Ready to Transform Your Customer Experience?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Join thousands of businesses already using AI voice agents to improve customer satisfaction and reduce costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="default"
              size="xl"
              className="bg-white text-slate-800 hover:bg-white/90 font-semibold gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="glass"
              size="xl"
              className="font-semibold text-white"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-theme-gradient rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-theme-gradient">AI Agents</span>
              </div>
              <p className="text-muted-foreground text-sm">
                The leading platform for building and deploying AI voice agents across all channels.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Voice Cake. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}