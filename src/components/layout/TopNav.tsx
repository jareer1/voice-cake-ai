import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateAgentModal } from "@/components/modals/CreateAgentModal";

export function TopNav() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search agents, tools..." 
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        {/* Dummy Avatar with first letter from username */}
        <button
          className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 text-white font-bold flex items-center justify-center text-lg shadow-md focus:outline-none"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="User menu"
        >
          {localStorage.getItem('username')?.charAt(0)?.toUpperCase() || 'A'}
        </button>
        {/* Dropdown for logout */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-white border border-border rounded-lg shadow-lg z-50">
            <button
              className="w-full text-left px-4 py-2 text-foreground hover:bg-gray-100 rounded-lg"
              onClick={() => {
                localStorage.clear();
                window.location.href = '/auth/signin';
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => {
          console.log('Creating agent:', data);
          // Handle agent creation
        }}
      />
    </header>
  );
}