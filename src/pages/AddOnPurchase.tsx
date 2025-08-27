import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFinance } from "@/context/financeContext";
import { useNavigate } from "react-router-dom";

export default function AddOnPurchase() {
  const { purchaseVoiceClone, purchasePremiumVoice, voiceClonePurchased, getWallet, topupWallet, setPremiumSurcharge } = useFinance();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"vc" | "pv" | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(500); // cents
  const [surcharge, setSurcharge] = useState<number>(0);

  const refreshWallet = async () => {
    try {
      const w = await getWallet();
      setWalletBalance(w.balance_cents);
      setSurcharge(w.premium_voice_surcharge_cents);
    } catch {}
  };

  // Load wallet on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => { refreshWallet(); });

  const handleVoiceClone = async () => {
    if (voiceClonePurchased) {
      // If already purchased, redirect to voice clone page
      navigate("/voice-clone");
      return;
    }

    setLoading("vc");
    try {
      await purchaseVoiceClone();
      toast.success("Voice cloning purchased ($5).");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to purchase voice clone");
    } finally {
      setLoading(null);
    }
  };

  const handlePremiumVoice = async () => {
    setLoading("pv");
    try {
      await purchasePremiumVoice();
      toast.success("Premium voice surcharge enabled.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to purchase premium voice");
    } finally {
      setLoading(null);
    }
  };

  const handleTopup = async () => {
    try {
      await topupWallet(topupAmount);
      toast.success("Wallet topped up");
      await refreshWallet();
    } catch (e: any) {
      toast.error(e?.message ?? "Top-up failed");
    }
  };

  const handleSetSurcharge = async () => {
    try {
      await setPremiumSurcharge(surcharge);
      toast.success("Premium surcharge updated");
      await refreshWallet();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update surcharge");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold">Voice Cloning</h2>
            <p className="text-muted-foreground text-sm">Clone a new voice for $5 one-time</p>
          </div>
          <Button className="btn-theme-gradient" onClick={handleVoiceClone} disabled={loading === "vc"}>
            {loading === "vc" ? "Processing..." : voiceClonePurchased ? "Clone Your Voice" : "Purchase ($5)"}
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold">Premium Voices</h2>
            <p className="text-muted-foreground text-sm">Enable premium voices ($0.01–$0.02/min)</p>
          </div>
          <Button className="btn-theme-gradient" onClick={handlePremiumVoice} disabled={loading === "pv"}>
            {loading === "pv" ? "Processing..." : "Enable"}
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Wallet</h2>
            <div className="text-sm text-muted-foreground">Balance: {walletBalance !== null ? `$${(walletBalance/100).toFixed(2)}` : "—"}</div>
          </div>
          <div className="flex gap-2 items-center">
            <input type="number" value={topupAmount} onChange={(e) => setTopupAmount(parseInt(e.target.value||'0'))} className="border rounded px-2 py-1 w-32" />
            <span className="text-sm text-muted-foreground">cents</span>
            <Button onClick={handleTopup}>Top Up</Button>
          </div>
          <div className="flex gap-2 items-center">
            <input type="number" min={0} max={5} value={surcharge} onChange={(e) => setSurcharge(parseInt(e.target.value||'0'))} className="border rounded px-2 py-1 w-32" />
            <span className="text-sm text-muted-foreground">cents/min premium surcharge</span>
            <Button variant="outline" onClick={handleSetSurcharge}>Set</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


