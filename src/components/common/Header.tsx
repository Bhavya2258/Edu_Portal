import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  GraduationCap,
  Shield,
  BookOpen,
  UserCheck,
  LogOut,
  Wifi
} from "lucide-react";
import { UserRole } from "../../types";

interface HeaderProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return { label: "ADMINISTRATOR", icon: Shield };
      case "teacher":
        return { label: "FACULTY INSTRUCTOR", icon: BookOpen };
      case "student":
        return { label: "STUDENT", icon: GraduationCap };
      default:
        return { label: "PENDING APPROVAL", icon: UserCheck };
    }
  };

  const badge = user ? getRoleBadge(user.role) : null;

  return (
    <header className="sticky top-0 z-40 bg-black text-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Institution Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tighter text-white uppercase font-sans">
                  EduPortal
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-800 text-white border border-neutral-700">
                  INSTITUTIONAL
                </span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 hidden md:block">
                WebRTC Broadcast & Campus Management System
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Campus Wi-Fi Status Tag */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-neutral-900 border border-neutral-800 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campus Wi-Fi: <strong className="font-extrabold text-white">EduPortal-5G</strong></span>
            </div>

            {/* Current User Info & Logout */}
            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-neutral-800">
                <div className="flex items-center space-x-2.5">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 object-cover border border-white"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-black text-white truncate max-w-[150px] uppercase">
                      {user.name}
                    </p>
                    {badge && (
                      <span className="inline-block text-[9px] font-black uppercase tracking-widest text-neutral-400">
                        {badge.label}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={logout}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700 cursor-pointer"
                  title="Sign out of Google Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
