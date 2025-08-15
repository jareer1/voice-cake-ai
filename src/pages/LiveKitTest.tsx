import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Phone, Activity, Trash2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VoiceAssistant from "@/components/VoiceAssistant";
import config from "@/lib/config";

export default function LiveKitTest() {
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const checkHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const response = await fetch(`${config.api.baseURL}/livekit/health`);
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(`✅ Healthy - ${data.status || 'OK'}`);
      } else {
        setHealthStatus('❌ Service Unavailable');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus('❌ Connection Failed');
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const listSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`${config.api.baseURL}/livekit/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        console.error('Failed to fetch sessions');
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const cleanupSessions = async () => {
    setIsCleaningUp(true);
    try {
      const response = await fetch(`${config.api.baseURL}/livekit/cleanup`, {
        method: 'POST',
      });
      if (response.ok) {
        console.log('✅ Cleanup completed');
        // Refresh sessions list
        await listSessions();
      } else {
        console.error('Cleanup failed');
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${config.api.baseURL}/livekit/session/${sessionId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        console.log(`✅ Session ${sessionId} deleted`);
        // Refresh sessions list
        await listSessions();
      } else {
        console.error(`Failed to delete session ${sessionId}`);
      }
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">LiveKit Voice Assistant Test</h1>
              <p className="text-muted-foreground">
                Test your LiveKit implementation with real-time voice chat
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Voice Assistant */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Voice Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceAssistant />
              </CardContent>
            </Card>
          </div>

          {/* Controls & Status */}
          <div className="space-y-4">
            {/* Health Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Service Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={checkHealth} 
                  disabled={isLoadingHealth}
                  className="w-full"
                >
                  {isLoadingHealth ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      Check Health
                    </>
                  )}
                </Button>
                
                {healthStatus && (
                  <Alert>
                    <AlertDescription>
                      {healthStatus}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Sessions Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Active Sessions
                  </span>
                  <Badge variant="secondary">
                    {sessions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    onClick={listSessions} 
                    disabled={isLoadingSessions}
                    variant="outline"
                    className="flex-1"
                  >
                    {isLoadingSessions ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={cleanupSessions} 
                    disabled={isCleaningUp}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isCleaningUp ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Cleaning...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cleanup All
                      </>
                    )}
                  </Button>
                </div>

                {/* Sessions List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active sessions
                    </p>
                  ) : (
                    sessions.map((session, index) => (
                      <div 
                        key={session.session_id || index}
                        className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {session.session_id?.slice(0, 8) || `Session ${index + 1}`}...
                          </p>
                          <p className="text-muted-foreground">
                            {session.status || 'Unknown'} • {session.participant_identity || 'N/A'}
                          </p>
                        </div>
                        <Button
                          onClick={() => deleteSession(session.session_id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* API Info */}
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Base URL:</strong> {config.api.baseURL}</p>
                <p><strong>LiveKit Endpoints:</strong></p>
                <ul className="text-xs text-muted-foreground ml-4 space-y-1">
                  <li>• POST /livekit/session/start</li>
                  <li>• GET /livekit/session/&#123;id&#125;/status</li>
                  <li>• DELETE /livekit/session/&#123;id&#125;</li>
                  <li>• GET /livekit/sessions</li>
                  <li>• POST /livekit/session/&#123;id&#125;/message</li>
                  <li>• GET /livekit/health</li>
                  <li>• POST /livekit/cleanup</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="space-y-2">
              <li><strong>Health Check:</strong> First, verify your LiveKit service is running by clicking "Check Health"</li>
              <li><strong>Start Session:</strong> Enter your name and click "Start Voice Chat" to create a new LiveKit session</li>
              <li><strong>Voice Chat:</strong> Once connected and agent is ready, click "Start Talking" to begin voice conversation</li>
              <li><strong>Text Messages:</strong> Use the text input or quick action buttons to send text messages to the agent</li>
              <li><strong>Monitor Sessions:</strong> Use the "Refresh" button to see active sessions and "Cleanup All" to end all sessions</li>
              <li><strong>End Session:</strong> Click "End Session" when done to properly cleanup the connection</li>
            </ol>
            
            <div className="mt-4 p-3 bg-muted rounded">
              <p className="text-sm"><strong>Note:</strong> Make sure you have the livekit-client package installed:</p>
              <code className="text-xs">npm install livekit-client</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
