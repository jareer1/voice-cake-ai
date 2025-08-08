import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Palette, 
  Globe,
  Key,
  Trash2,
  Upload,
  Save,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { ApiKeyInfo, useFinance } from "@/context/financeContext";
import { toast } from "sonner";
import GreenSpinner from "@/components/ui/GreenSpinner";

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    avatar: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    agentAlerts: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    passwordLastChanged: string;
  };
  billing: {
    plan: string;
    usage: number;
    limit: number;
    nextBilling: string;
    paymentMethod: string;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
    dateFormat: string;
  };
}

const mockSettings: UserSettings = {
  profile: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    company: "Tech Corp",
    avatar: ""
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    agentAlerts: true,
    weeklyReports: false,
    marketingEmails: false
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordLastChanged: "2024-01-15"
  },
  billing: {
    plan: "Pro",
    usage: 7500,
    limit: 10000,
    nextBilling: "2024-02-15",
    paymentMethod: "**** 4242"
  },
  preferences: {
    theme: "light",
    language: "en",
    timezone: "UTC-8",
    dateFormat: "MM/DD/YYYY"
  }
};

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Show success message
    }, 1000);
  };

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Button 
          size="lg" 
          className="gap-2 btn-theme-gradient border border-theme-primary hover:border-theme-secondary hover:shadow-lg"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Save className="w-5 h-5" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={settings.profile.avatar} />
                    <AvatarFallback className="text-lg avatar-theme-gradient text-white">
                      {settings.profile.firstName[0]}{settings.profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={settings.profile.firstName}
                        onChange={(e) => updateSetting('profile', 'firstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={settings.profile.lastName}
                        onChange={(e) => updateSetting('profile', 'lastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={settings.profile.email}
                        onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        className="pl-10"
                        value={settings.profile.phone}
                        onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={settings.profile.company}
                      onChange={(e) => updateSetting('profile', 'company', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose which notifications you'd like to receive
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'pushNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Agent Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when agents need attention
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.agentAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'agentAlerts', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance summaries
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyReports}
                    onCheckedChange={(checked) => updateSetting('notifications', 'weeklyReports', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketingEmails}
                    onCheckedChange={(checked) => updateSetting('notifications', 'marketingEmails', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Password & Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button className="btn-theme-gradient">
                  Update Password
                </Button>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => updateSetting('security', 'twoFactorAuth', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select
                    value={settings.security.sessionTimeout}
                    onValueChange={(value) => updateSetting('security', 'sessionTimeout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* API Keys Section - moved from ApiKeys.tsx, now with tabs for each scope */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your API keys for integrations
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="conversa" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="conversa" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-700 data-[state=active]:to-emerald-700 data-[state=active]:text-white">Conversa</TabsTrigger>
                    <TabsTrigger value="empath" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-700 data-[state=active]:to-emerald-700 data-[state=active]:text-white">Empath</TabsTrigger>
                    <TabsTrigger value="wallet" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-700 data-[state=active]:to-emerald-700 data-[state=active]:text-white">Wallet</TabsTrigger>
                  </TabsList>
                  {['conversa', 'empath', 'wallet'].map(scope => (
                    <TabsContent value={scope} key={scope}>
                      <ApiKeyTab scope={scope} />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{settings.billing.plan} Plan</h3>
                    <p className="text-muted-foreground">$49/month • Next billing: {settings.billing.nextBilling}</p>
                  </div>
                  <Badge className="badge-theme-gradient">
                    Active
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage this month</span>
                    <span>{settings.billing.usage.toLocaleString()} / {settings.billing.limit.toLocaleString()} minutes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="progress-theme-gradient h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(settings.billing.usage / settings.billing.limit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    Upgrade Plan
                  </Button>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    Cancel Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Credit Card</p>
                      <p className="text-sm text-muted-foreground">Ending in {settings.billing.paymentMethod}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>

                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.preferences.theme}
                    onValueChange={(value) => updateSetting('preferences', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value) => updateSetting('preferences', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.preferences.timezone}
                    onValueChange={(value) => updateSetting('preferences', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                      <SelectItem value="UTC-0">UTC</SelectItem>
                      <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.preferences.dateFormat}
                    onValueChange={(value) => updateSetting('preferences', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Danger Zone</h4>
                <div className="border border-destructive/20 rounded-lg p-4 space-y-4">
                  <div>
                    <h5 className="font-medium text-destructive">Delete Account</h5>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add this component inside the file (below Settings)
function ApiKeyTab({ scope }: { scope: string }) {
  const { listApiKeys, rotateApiKey, revokeApiKey } = useFinance();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const items = await listApiKeys(scope);
        setKeys(items.filter(k => k.scope === scope));
      } catch {
        setKeys([]);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [scope, listApiKeys]);

  const handleRotate = async () => {
    setLoading(true);
    try {
      const data = await rotateApiKey(scope);
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
  );
}
