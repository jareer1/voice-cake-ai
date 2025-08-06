import { Bot, Settings, TestTube, Mic, Users, Home, Plus } from "lucide-react";
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
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Test Agent", url: "/test", icon: TestTube },
  { title: "Voice Clone", url: "/voice-clone", icon: Mic },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar 
      className={`transition-all duration-300 ease-in-out`}
      collapsible="icon"
      side="left"
    >
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Show only toggle button when collapsed */}
        {collapsed ? (
          <div className="p-4 flex justify-center">
            <SidebarTrigger className="text-sidebar-foreground hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-slate-900 hover:text-white transition-all duration-300" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="transition-all duration-300 ease-in-out overflow-hidden">
                  <h2 className="font-bold text-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent whitespace-nowrap">Voice Cake</h2>
                  <p className="text-xs text-sidebar-foreground/70 whitespace-nowrap">Voice Platform</p>
                </div>
              </div>
            </div>

            {/* Menu */}
            <SidebarGroup className="flex-1">
              <SidebarGroupLabel className="text-sidebar-foreground/70 transition-all duration-300 ease-in-out">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 px-2">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive: navActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                              navActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            }`
                          }
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap">
                            {item.title}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Footer with toggle */}
            <div className="p-4 border-t border-sidebar-border">
              <SidebarTrigger className="w-full text-sidebar-foreground hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-slate-900 hover:text-white transition-all duration-300" />
            </div>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}