import { Bot, Settings, TestTube, Mic, Users, Home, KeyRound, Wrench, Menu, Grid3X3, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: "dashboard", isSvg: true },
  { title: "Agents", url: "/agents", icon: "agent", isSvg: true },
  { title: "Tools", url: "/tools", icon: Wrench, isSvg: false },
  { title: "Usage", url: "/usage", icon: Users, isSvg: false },
  { title: "Add-ons", url: "/addons", icon: Mic, isSvg: false },
  { title: "API", url: "/api", icon: KeyRound, isSvg: false },
  { title: "Settings", url: "/settings", icon: Settings, isSvg: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const renderIcon = (item: any) => {
    if (item.isSvg) {
      return (
        <img 
          src={`/${item.icon}.svg`} 
          alt={item.title} 
          className="w-6 h-6 flex-shrink-0"
        />
      );
    } else {
      const IconComponent = item.icon;
      return <IconComponent className="w-6 h-6 flex-shrink-0 text-gray-500" />;
    }
  };

  return (
    <Sidebar 
      className={`transition-all duration-300 ease-in-out`}
      collapsible="icon"
      side="left"
    >
      <SidebarContent className="bg-white border-r border-gray-100 overflow-hidden">
        {/* Show only toggle button when collapsed */}
        {collapsed ? (
          <div className="p-4 flex flex-col items-center w-full">
            {/* Header with VoiceCake branding - logo only */}
            <div className="mb-6 flex justify-center">
              <img 
                src="https://voicecake.vercel.app/assets/img/logo/voice-cake-logo-gradient.svg" 
                alt="Voice Cake Logo" 
                className="w-[46px] h-[31px] flex-shrink-0"
              />
            </div>

            {/* Navigation Menu Icons */}
            <SidebarGroup className="flex-1 w-full">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 flex flex-col items-center">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title} className="w-full flex justify-center">
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`flex items-center justify-center p-3 rounded-[30px] transition-all duration-200 ${
                            isActive(item.url) 
                              ? "bg-[#CDFFF1] min-w-[45px] h-[45px]" 
                              : "text-black hover:bg-gray-50 min-w-[45px] h-[45px]"
                          }`}
                          title={item.title}
                        >
                          {renderIcon(item)}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Dotted horizontal line */}
            <div className="w-full flex justify-center my-4">
              <div className="w-12 h-px bg-gray-300 border-dashed border-t-2"></div>
            </div>

            {/* Profile Icon */}
            <div className="w-full flex justify-center">
              <div className="flex items-center justify-center p-3 rounded-full w-[45px] h-[45px] overflow-hidden">
                <img 
                  src="/profilee.svg" 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header with VoiceCake branding */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                <img 
                  src="https://voicecake.vercel.app/assets/img/logo/voice-cake-logo-gradient.svg" 
                  alt="Voice Cake Logo" 
                  className="w-[46px] h-[31px] flex-shrink-0"
                />
                <div className="transition-all duration-300 ease-in-out overflow-hidden">
                  <h2 className="font-inter font-semibold text-[15px] leading-[140%] tracking-[-0.02em] text-black whitespace-nowrap">Voice Cake</h2>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <SidebarGroup className="flex-1">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 px-2 py-4">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`flex items-center gap-3 px-4 py-3 rounded-[30px] transition-all duration-200 ${
                            isActive(item.url) 
                              ? "bg-[#CDFFF1] min-w-[176px] h-[45px]" 
                              : "text-black hover:bg-gray-50 min-w-[176px] h-[45px]"
                          }`}
                        >
                          {renderIcon(item)}
                          <span className="font-inter font-normal text-[15px] whitespace-nowrap">
                            {item.title}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}