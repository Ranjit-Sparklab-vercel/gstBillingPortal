"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, User, LogOut, ChevronDown, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator as CalculatorComponent } from "@/components/common/calculator";
import { CalculatorIcon } from "@/components/common/calculator-icon";
import { ProfileDialog } from "@/components/common/profile-dialog";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export function Topbar() {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Static user data for Glowline (temporary)
  const displayUser = {
    name: "SANGRAM SANTRAM KURADE",
    email: "glowline.thermoplastic@gmail.com",
  };

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
    setIsUserMenuOpen(false);
  };

  const handleMyProfile = () => {
    setIsProfileOpen(true);
    setIsUserMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-2"
          >
            <CalculatorIcon className="h-6 w-6" />
            Open Calculator
          </Button>
          <Button variant="ghost" size="icon" title="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="relative border-l pl-3" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium truncate">{displayUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{displayUser.email}</p>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isUserMenuOpen && "transform rotate-180"
                )}
              />
            </button>

            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-background shadow-lg z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b mb-1">
                    <p className="text-sm font-medium truncate">{displayUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{displayUser.email}</p>
                  </div>
                  <button
                    onClick={handleMyProfile}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calculator Component */}
      <CalculatorComponent
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
      />

      {/* Profile Dialog */}
      <ProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </>
  );
}
