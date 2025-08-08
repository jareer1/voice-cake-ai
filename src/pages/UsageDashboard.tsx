import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinance, type UsageMeter } from "@/context/financeContext";

export default function UsageDashboard() {
  const { getUsage } = useFinance();
  const [botType, setBotType] = useState<"conversa" | "empath">("conversa");
  const [usage, setUsage] = useState<UsageMeter | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUsage(botType);
        setUsage(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [botType, getUsage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usage</h1>
        <div className="flex gap-2">
          <Button variant={botType === "conversa" ? "default" : "outline"} onClick={() => setBotType("conversa")} className={botType === "conversa" ? "btn-theme-gradient" : ""}>Conversa</Button>
          <Button variant={botType === "empath" ? "default" : "outline"} onClick={() => setBotType("empath")} className={botType === "empath" ? "btn-theme-gradient" : ""}>Empath</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Minutes Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && <div className="h-24 rounded-md bg-muted animate-pulse" />}
            {usage && botType === "conversa" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">STT</div>
                  <div className="text-xl font-semibold">{usage.stt_minutes?.toFixed(2)} min</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">TTS</div>
                  <div className="text-xl font-semibold">{usage.tts_minutes?.toFixed(2)} min</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">LLM</div>
                  <div className="text-xl font-semibold">{usage.llm_minutes?.toFixed(2)} min</div>
                </div>
              </div>
            )}
            {usage && botType === "empath" && (
              <div>
                <div className="text-sm text-muted-foreground">Empath Minutes</div>
                <div className="text-xl font-semibold">{usage.empath_minutes?.toFixed(2)} min</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            {usage ? (
              <div className="text-lg">{new Date(usage.updated_at).toLocaleString()}</div>
            ) : (
              <div className="h-8 rounded-md bg-muted animate-pulse" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


