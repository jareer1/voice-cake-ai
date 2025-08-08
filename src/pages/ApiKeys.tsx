import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinance, type ApiKeyInfo } from "@/context/financeContext";
import { toast } from "sonner";

export default function ApiKeys() {
  const { listApiKeys, rotateApiKey, revokeApiKey } = useFinance();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const items = await listApiKeys();
        setKeys(items);
      } catch {
        setKeys([]);
      }
    };
    load();
  }, [listApiKeys]);

  const handleRotate = async () => {
    setLoading(true);
    try {
      const data = await rotateApiKey(scope || "conversa");
      setRevealed(true);
      // Prepend new key raw
      setKeys((prev) => [{ id: data.id, scope: data.scope, preview: data.api_key_raw || undefined, is_active: true }, ...prev]);
      setRevealed(true);
      if (data.api_key_raw) toast.success("New API key generated. Copy and store it securely.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to rotate API key");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      if (!keys[0]?.id) return;
      await revokeApiKey(keys[0].id as number);
      setKeys((prev) => prev.map((k, i) => (i === 0 ? { ...k, is_active: false } : k)));
      toast.success("API key revoked");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to revoke API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1 w-48"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="">Select scope</option>
              <option value="conversa">conversa</option>
              <option value="empath">empath</option>
              <option value="wallet">wallet</option>
            </select>
            <Button className="btn-theme-gradient" onClick={handleRotate} disabled={loading}>
              {loading ? "Processing..." : "Generate New API Key"}
            </Button>
            <Button variant="outline" onClick={handleRevoke} disabled={loading}>
              Revoke Latest Key
            </Button>
          </div>

          {keys.length > 0 && keys[0]?.preview && keys[0].preview.length > 12 ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Your new API key (visible once)</div>
              <Input readOnly value={keys[0].preview as string} onFocus={(e) => e.currentTarget.select()} />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Keys are masked after creation. Generate a new one to view raw value once.</div>
          )}

          <div className="pt-4">
            <div className="text-sm font-medium mb-2">Your Keys</div>
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={String(k.id)} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="text-sm">
                    <div className="font-mono">{k.preview || "************"}</div>
                    <div className="text-xs text-muted-foreground">scope: {k.scope} • {k.is_active ? "active" : "revoked"}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{k.created_at ? new Date(k.created_at).toLocaleString() : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


