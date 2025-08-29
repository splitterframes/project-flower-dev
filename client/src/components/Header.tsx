import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { LogOut, User, Coins } from "lucide-react";

interface HeaderProps {
  onAuthClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick }) => {
  const { user, logout } = useAuth();
  const { credits } = useCredits();

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">GameHub</h1>
        </div>

        {/* Right side - User info or Login button */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Credits Display */}
              <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg border border-orange-500">
                <Coins className="h-5 w-5 text-orange-400" />
                <span className="text-orange-400 font-semibold">{credits} Cr</span>
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-2 text-slate-300">
                <User className="h-5 w-5" />
                <span>{user.username}</span>
              </div>
              
              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={onAuthClick}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Login / Register
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
