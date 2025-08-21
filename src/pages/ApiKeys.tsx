import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinance } from "@/context/financeContext";
import { toast } from "sonner";
import GreenSpinner from "@/components/ui/GreenSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ApiKeys() {
  const { listApiKeys, rotateApiKey, revokeApiKey } = useFinance();
  const [keys, setKeys] = useState<any[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedScope, setSelectedScope] = useState("conversa");

  const endpoints = [
    {
      endpoint: "/v1/Assistant",
      method: "Post",
      description: "Create Assistant"
    },
    {
      endpoint: "/v1/Assistant",
      method: "Post",
      description: "Conversa Synesis"
    },
    {
      endpoint: "/v1/Assistant",
      method: "GET",
      description: "Conversa Synesis"
    }
  ];

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const items = await listApiKeys(selectedScope);
        setKeys(items.filter((k: any) => k.scope === selectedScope));
      } catch {
        setKeys([]);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [selectedScope, listApiKeys]);

  const handleRotate = async () => {
    setLoading(true);
    try {
      const data = await rotateApiKey(selectedScope);
      setRevealed(true);
      setKeys(prev => [{ id: data.id, scope: data.scope, preview: data.api_key_raw || undefined, is_active: true }, ...prev]);
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
      setKeys(prev => prev.map((k, i) => (i === 0 ? { ...k, is_active: false } : k)));
      toast.success("API key revoked");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to revoke API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#111C2D99' }}>API</h1>
      </div>

      {/* API Keys Section - moved from Settings, now with tabs for each scope */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your API keys for integrations
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="conversa" className="space-y-4" onValueChange={setSelectedScope}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="conversa" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-700 data-[state=active]:to-emerald-700 data-[state=active]:text-white">Conversa</TabsTrigger>
              <TabsTrigger value="empath" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-700 data-[state=active]:to-emerald-700 data-[state=active]:text-white">Empath</TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-700 data-[state=active]:to-emerald-700 data-[state=active]:text-white">Wallet</TabsTrigger>
            </TabsList>
            {['conversa', 'empath', 'wallet'].map(scope => (
              <TabsContent value={scope} key={scope}>
                <div className="space-y-4">
                  {fetching ? (
                    <div className="flex justify-center py-8">
                      <GreenSpinner />
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 items-center">
                        <Button className="btn-theme-gradient" onClick={handleRotate} disabled={loading}>
                          Generate New API Key
                        </Button>
                        <Button variant="outline" onClick={handleRevoke} disabled={loading}>
                          Revoke Latest Key
                        </Button>
                      </div>
                      {keys.length > 0 && keys[0]?.preview && keys[0].preview.length > 12 ? (
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Your new API key (visible once)</div>
                          <Input readOnly value={keys[0].preview as string} onFocus={e => e.currentTarget.select()} />
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Keys are masked after creation. Generate a new one to view raw value once.</div>
                      )}
                      <div className="pt-4">
                        <div className="text-sm font-medium mb-2">Your Keys</div>
                        <div className="space-y-2">
                          {keys.map(k => (
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
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* REST Endpoints Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">REST Endpoints(sample)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-white">
                <TableHead className="font-medium text-gray-700 py-4">Endpoint</TableHead>
                <TableHead className="font-medium text-gray-700 py-4">Method</TableHead>
                <TableHead className="font-medium text-gray-700 py-4">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((endpoint, index) => (
                <TableRow key={index} className="bg-background border-b border-gray-200">
                  <TableCell className="py-4">
                    <span className="font-mono text-sm text-gray-900">{endpoint.endpoint}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      endpoint.method === 'GET' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {endpoint.method}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700">{endpoint.description}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


