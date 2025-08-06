import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Play, Square, Clock, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PublicTest() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [hasStarted, setHasStarted] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasStarted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setHasStarted(true);
    setIsRecording(true);
    // Simulate initial AI greeting
    setTimeout(() => {
      setAiResponse("Hello! I'm your AI assistant. How can I help you today?");
      setIsAiSpeaking(true);
      setTimeout(() => setIsAiSpeaking(false), 2000);
    }, 1000);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Simulate user speech transcription
      setTimeout(() => {
        setUserTranscript("Hello, I need help with my account settings...");
      }, 2000);
      
      // Simulate AI response after user finishes
      setTimeout(() => {
        setAiResponse("I'd be happy to help you with your account settings. Can you tell me specifically what you'd like to change?");
        setIsAiSpeaking(true);
        setTimeout(() => setIsAiSpeaking(false), 3000);
      }, 4000);
    }
  };

  return (
    <div className="h-screen w-screen bg-white overflow-hidden flex relative">
      {/* Back Button */}
      <button
        className="absolute top-4 left-4 z-50 bg-white/80 border border-gray-200 rounded-full px-4 py-2 text-gray-700 shadow hover:bg-white"
        onClick={() => navigate(-1)}
        aria-label="Back"
      >
        ← Back
      </button>
      {/* Left Side - Agent & Controls */}
      <div className="w-1/2 bg-theme-gradient relative overflow-hidden flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md p-8">
          {/* Status Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-gray-800 border border-white/20 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">AI Agent Demo</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              Experience Voice AI
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              Test our intelligent customer support agent for free
            </p>
          </div>

          {/* Agent Avatar */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Avatar className="w-32 h-32 ring-4 ring-white/30 shadow-2xl">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="avatar-theme-gradient text-white text-3xl font-bold">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Timer and Status */}
          {hasStarted && (
            <div className="text-center mb-6">
              <Badge className="gap-2 bg-white/20 border-white/30 text-white font-semibold px-4 py-2 text-lg">
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </Badge>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-4">
            {!hasStarted ? (
              <Button 
                variant="default" 
                size="xl" 
                className="w-full bg-white text-slate-800 hover:bg-white/90 font-bold text-lg py-6 shadow-2xl transition-all duration-300 hover:scale-105"
                onClick={handleStartTest}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-slate-800" />
                  </div>
                  Start 5-Minute Demo
                </div>
              </Button>
            ) : (
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="xl"
                className={`w-full font-bold text-lg py-6 shadow-2xl transition-all duration-300 hover:scale-105 ${
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-white text-slate-800 hover:bg-white/90"
                }`}
                onClick={toggleRecording}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isRecording ? "bg-white/20" : "bg-slate-100"
                  }`}>
                    {isRecording ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4 text-slate-800" />
                    )}
                  </div>
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </div>
              </Button>
            )}
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="text-center mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex justify-center items-center gap-3 text-white">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-red-400 rounded-full animate-ping opacity-50"></div>
                </div>
                <span className="font-semibold">AI is listening...</span>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="flex items-center gap-2 text-white bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">Natural Voice</span>
            </div>
            <div className="flex items-center gap-2 text-white bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Voice Input</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Transcription & Responses */}
      <div className="w-1/2 bg-white flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Conversation</h2>
          <p className="text-gray-600">Real-time transcription and AI responses</p>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* User Transcript */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900">You</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-h-[120px]">
              {userTranscript ? (
                <p className="text-gray-900 leading-relaxed">{userTranscript}</p>
              ) : (
                <p className="text-gray-500 italic">Your speech will appear here when you start talking...</p>
              )}
            </div>
          </div>

          {/* AI Response */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              {isAiSpeaking && <span className="text-sm text-green-600 font-medium">Speaking...</span>}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[120px]">
              {aiResponse ? (
                <p className="text-gray-900 leading-relaxed">{aiResponse}</p>
              ) : (
                <p className="text-gray-500 italic">AI responses will appear here...</p>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ready to Build Your Own?
            </h3>
            <p className="text-gray-700 mb-4">
              Create custom AI voice agents for your business
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                className="btn-theme-gradient hover:shadow-lg font-semibold px-6 py-2"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-2"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 text-center">
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-semibold">🚀 Free 5-minute trial • No registration required</p>
            <p>By using this service, you agree to our terms of use and privacy policy</p>
          </div>
        </div>
      </div>
    </div>
  );
}