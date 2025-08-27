import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Trash2,
  Upload,
  Save,
  Mail
} from "lucide-react";

import { userAPI } from "@/pages/services/api";
import { toast } from "sonner";
import GreenSpinner from "@/components/ui/GreenSpinner";

console.log('📦 userAPI imported:', userAPI);

interface UserData {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  avatar_url: string | null;
  job_title: string | null;
  bio: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
}

const mockSettings: UserSettings = {
  profile: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    avatar: ""
  }
};

export default function Settings() {
  console.log('🚀 Settings component mounted');
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Prepare user data for update
      const updateData = {
        full_name: `${settings.profile.firstName} ${settings.profile.lastName}`.trim(),
        // Note: email updates might require separate verification
        // avatar_url updates might require file upload endpoint
      };

      const response = await userAPI.updateUser(updateData);
      if (response.success) {
        toast.success('Profile updated successfully');
        // Update local user data
        if (userData) {
          setUserData(prev => prev ? { ...prev, ...updateData } : null);
        }
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update user data:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('🔄 Fetching user data...');
      try {
        const response = await userAPI.getCurrentUser();
        console.log('📡 API Response:', response);
        
        if (response.success && response.data) {
          const user = response.data;
          console.log('👤 User data:', user);
          setUserData(user);
          
          // Parse full_name into first and last name
          const nameParts = user.full_name ? user.full_name.split(' ') : ['', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Update settings with real user data
          setSettings({
            profile: {
              firstName,
              lastName,
              email: user.email,
              avatar: user.avatar_url || ''
            }
          });
          console.log('✅ User data loaded successfully');
        } else {
          console.log('❌ API response not successful:', response);
        }
      } catch (error) {
        console.error('❌ Failed to fetch user data:', error);
        toast.error('Failed to load user profile data');
      } finally {
        setIsLoadingUser(false);
        console.log('🏁 User data loading finished');
      }
    };

    fetchUserData();
  }, []);

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

      {/* Profile Section */}
      <div className="space-y-6">
          {isLoadingUser ? (
            <div className="flex justify-center py-8">
              <GreenSpinner />
            </div>
          ) : (
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

                  

                  {/* User Status Information */}
                  {userData && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Account Status</span>
                        <Badge variant={userData.is_active ? "default" : "secondary"}>
                          {userData.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Email Verification</span>
                        <Badge variant={userData.is_verified ? "default" : "destructive"}>
                          {userData.is_verified ? "Verified" : "Not Verified"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Member Since</span>
                        <span className="text-sm">
                          {new Date(userData.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="text-sm">
                          {new Date(userData.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </div>
    </div>
  );
}


