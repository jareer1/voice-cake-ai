import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinance, type UsageMeter } from "@/context/financeContext";
import GreenSpinner from "@/components/ui/GreenSpinner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function UsageDashboard() {
  const { getUsage } = useFinance();
  const [botType, setBotType] = useState<"conversa" | "empath">("conversa");
  const [usage, setUsage] = useState<UsageMeter | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ date: string; requests: number }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  // Dummy usage history data (dynamic dates)
  useEffect(() => {
    const today = new Date();
    const days = 14;
    const dummyHistory = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - i - 1));
      return {
        date: d.toISOString().slice(0, 10),
        requests: Math.floor(50 + Math.random() * 100),
      };
    });
    setHistory(dummyHistory);
    setHistoryLoading(false);
  }, [botType]);

  // Chart data
  const chartData = {
    labels: history.map((h) => h.date),
    datasets: [
      {
        label: "Requests per Day",
        data: history.map((h) => h.requests),
        borderColor: "#14b8a6",
        backgroundColor: "rgba(16,185,129,0.1)",
        pointBackgroundColor: "#059669",
        pointBorderColor: "#059669",
        tension: 0.4,
        fill: true,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#059669",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#14b8a6",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: "#e0f2f1",
        },
        ticks: {
          color: "#059669",
        },
      },
      y: {
        grid: {
          color: "#e0f2f1",
        },
        ticks: {
          color: "#059669",
        },
      },
    },
  };

  return (
    <div className="animate-enter">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Usage</h1>
        <div className="flex gap-2">
          <Button
            variant={botType === "conversa" ? "default" : "outline"}
            onClick={() => setBotType("conversa")}
            className={`rounded-full px-5 py-2 font-semibold transition-all duration-200 ${botType === "conversa" ? "btn-theme-gradient shadow-md" : "bg-card/80 hover:bg-card/90"}`}
          >
            Conversa
          </Button>
          <Button
            variant={botType === "empath" ? "default" : "outline"}
            onClick={() => setBotType("empath")}
            className={`rounded-full px-5 py-2 font-semibold transition-all duration-200 ${botType === "empath" ? "btn-theme-gradient shadow-md" : "bg-card/80 hover:bg-card/90"}`}
          >
            Empath
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/80 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-theme-gradient">Minutes Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <GreenSpinner />
              </div>
            ) : usage && botType === "conversa" ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">STT</div>
                  <div className="text-lg font-bold text-theme-gradient">{usage.stt_minutes?.toFixed(2)} min</div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">TTS</div>
                  <div className="text-lg font-bold text-theme-gradient">{usage.tts_minutes?.toFixed(2)} min</div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">LLM</div>
                  <div className="text-lg font-bold text-theme-gradient">{usage.llm_minutes?.toFixed(2)} min</div>
                </div>
              </div>
            ) : usage && botType === "empath" ? (
              <div className="rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Empath Minutes</div>
                <div className="text-lg font-bold text-theme-gradient">{usage.empath_minutes?.toFixed(2)} min</div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-32">
                <span className="text-muted-foreground">No usage data available.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-theme-gradient">Total Minutes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center h-full">
            {loading ? (
              <GreenSpinner />
            ) : usage ? (
              <div className="text-3xl font-bold text-theme-gradient">
                {botType === "conversa"
                  ? ((usage.stt_minutes ?? 0) + (usage.tts_minutes ?? 0) + (usage.llm_minutes ?? 0)).toFixed(2)
                  : usage.empath_minutes?.toFixed(2)} min
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-theme-gradient">Last Updated</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center h-full">
            {usage ? (
              <div className="text-base text-muted-foreground font-medium">
                {new Date(usage.updated_at).toLocaleString()}
              </div>
            ) : loading ? (
              <GreenSpinner />
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart below cards */}
      <div className="mt-4">
        <Card className="bg-card/80 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-theme-gradient">Requests per Day</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {historyLoading ? (
              <div className="flex justify-center items-center h-40">
                <GreenSpinner />
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} height={120} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


