import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/authContext";

export function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  const { logout } = useAuth();

  return (
    <header className="h-24 bg-white px-6 flex items-center justify-between">
      {/* Left side - Menu icons */}
      <div className="flex items-center gap-4">
        <button 
          className="text-gray-600 hover:bg-gray-100 hover:text-black transition-all duration-200 rounded-lg p-2"
          onClick={toggleSidebar}
        >
          <img src="/menu-icon.svg" alt="Menu" className="w-6 h-6" />
        </button>
        <button className="text-gray-600 hover:bg-gray-100 hover:text-black transition-all duration-200 rounded-lg p-2">
          <img src="/4-dots.svg" alt="Grid" className="w-6 h-6" />
        </button>
      </div>

      {/* Right side - Actions and user */}
      <div className="flex items-center gap-3">
        {/* Search icon */}
        <button className="text-gray-600 hover:bg-gray-100 hover:text-black transition-all duration-200 rounded-lg p-2">
          <img src="/searchh.svg" alt="Search" className="w-6 h-6" />
        </button>

        {/* Dark mode toggle */}
        <button className="text-gray-600 hover:bg-gray-100 hover:text-black transition-all duration-200 rounded-lg p-2">
          <img src="/moon.svg" alt="Dark Mode" className="w-6 h-6" />
        </button>

        {/* Messages */}
        <button className="text-gray-600 hover:bg-gray-100 hover:text-black transition-all duration-200 rounded-lg p-2">
          <img src="/inbox.svg" alt="Messages" className="w-6 h-6" />
        </button>

        {/* Notifications */}
        <button className="text-gray-600 hover:bg-gray-100 hover:text-black transition-all duration-200 rounded-lg p-2">
          <img src="/notification.svg" alt="Notifications" className="w-6 h-6" />
        </button>

        {/* User Avatar */}
        <button
          className="w-8 h-8 rounded-full overflow-hidden focus:outline-none"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="User menu"
        >
          <img src="/profilee.svg" alt="Profile" className="w-full h-full object-cover" />
        </button>

        {/* Dropdown for logout */}
        {isMenuOpen && (
          <div className="absolute right-6 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              className="w-full text-left px-4 py-2 text-black hover:bg-gray-100 rounded-lg font-inter text-base"
              onClick={async () => {
                try {
                  await logout();
                  // The logout function will handle the redirect
                } catch (error) {
                  console.error("Logout failed:", error);
                  // Fallback to manual logout
                  localStorage.clear();
                  window.location.href = '/auth/signin';
                }
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}