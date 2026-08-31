import React, { useState, useEffect, useCallback } from "react";
import { UserManagementTab } from "./UserManagementTab";
import { FeesManagementTab } from "./FeesManagementTab";
import { CourseManagementTab } from "./CourseManagementTab";
import { NoticeBoardTab } from "./NoticeBoardTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { api } from "../../services/api";
import { useSocketEvent } from "../../services/socket";
import {
  Users,
  DollarSign,
  BookOpen,
  Bell,
  BarChart3,
  Shield,
  GraduationCap,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"users" | "fees" | "courses" | "notices" | "analytics">("users");
  const [pendingCount, setPendingCount] = useState<number>(0);

  const checkPendingCount = useCallback(async () => {
    try {
      const pending = await api.getUsers({ status: "pending" });
      setPendingCount(pending.length);
    } catch (e) {
      console.error("Failed to check pending count", e);
    }
  }, []);

  useEffect(() => {
    checkPendingCount();
    const interval = setInterval(checkPendingCount, 4000);
    return () => clearInterval(interval);
  }, [checkPendingCount]);

  useSocketEvent("PENDING_USERS_UPDATED", (data: any) => {
    if (typeof data.count === "number") {
      setPendingCount(data.count);
    } else {
      checkPendingCount();
    }
  });

  useSocketEvent("USER_REGISTERED", () => {
    checkPendingCount();
  });

  useSocketEvent("USER_APPROVED", () => {
    checkPendingCount();
  });

  const tabs = [
    {
      id: "users",
      label: "USER MANAGEMENT & RBAC",
      icon: Users,
      badge: pendingCount > 0 ? `${pendingCount} PENDING` : undefined
    },
    { id: "fees", label: "FEES & PAYMENT TRACKER", icon: DollarSign },
    { id: "courses", label: "COURSES & FACULTY", icon: BookOpen },
    { id: "notices", label: "NOTICE BOARD", icon: Bell },
    { id: "analytics", label: "INSTITUTION ANALYTICS", icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Pending Account Urgent Action Banner */}
      {pendingCount > 0 && activeTab !== "users" && (
        <div className="bg-amber-400 border-2 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-black"></span>
            </span>
            <p className="text-xs font-black text-black uppercase tracking-tight">
              Action Required: {pendingCount} new Google sign-in registration{pendingCount > 1 ? "s are" : " is"} awaiting institutional approval.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("users")}
            className="py-1.5 px-4 bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 border border-black cursor-pointer shrink-0"
          >
            <span>Review & Approve</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Bold Header Banner */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-6 gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
              SYSTEM LEVEL: ROOT ADMIN
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              INSTITUTIONAL CONTROLLER
            </span>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-black m-0 font-sans">
            ADMIN <br />
            PORTAL
          </h1>
        </div>

        <div className="text-left md:text-right bg-white p-4 border-2 border-black space-y-0.5 min-w-[200px]">
          <div className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">
            ACADEMIC SESSION
          </div>
          <div className="text-2xl font-black uppercase text-black tracking-tight">FALL 2026</div>
          <div className="text-[11px] font-bold text-emerald-600 uppercase flex items-center md:justify-end gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ALL SERVICES ACTIVE
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 bg-white p-2 border-2 border-black overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`admin-tab-${t.id}`}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2 py-3 px-5 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer relative ${
                isActive
                  ? "bg-black text-white border-2 border-black"
                  : "bg-transparent text-neutral-700 hover:text-black hover:bg-neutral-100 border-2 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 border ${
                  isActive ? "bg-amber-400 text-black border-black" : "bg-amber-300 text-black border-black animate-pulse"
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-150">
        {activeTab === "users" && <UserManagementTab />}
        {activeTab === "fees" && <FeesManagementTab />}
        {activeTab === "courses" && <CourseManagementTab />}
        {activeTab === "notices" && <NoticeBoardTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
};
