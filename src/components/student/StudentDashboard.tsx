import React, { useState, useEffect } from "react";
import { Course } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { StudentLiveClassroom } from "./StudentLiveClassroom";
import { WifiAttendanceTab } from "./WifiAttendanceTab";
import { CourseEnrollmentTab } from "./CourseEnrollmentTab";
import { StudentNotesLecturesTab } from "./StudentNotesLecturesTab";
import { StudentFeesTab } from "./StudentFeesTab";
import { StudentNoticesTab } from "./StudentNoticesTab";
import {
  Video,
  Wifi,
  BookOpen,
  FileText,
  DollarSign,
  Bell,
  GraduationCap,
  Sparkles
} from "lucide-react";

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "attendance" | "courses" | "notes" | "fees" | "notices">("live");

  const loadCourses = async () => {
    try {
      const all = await api.getCourses();
      // Filter for enrolled courses or show all if student hasn't enrolled yet
      const enrolled = all.filter((c) => c.enrolledStudentIds?.includes(user?.id || ""));
      setCourses(enrolled.length > 0 ? enrolled : all);
    } catch (e) {
      console.error("Failed to load student courses", e);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [user]);

  const tabs = [
    { id: "live", label: "LIVE WEBRTC & QUIZZES", icon: Video },
    { id: "attendance", label: "WI-FI ATTENDANCE CHECK", icon: Wifi },
    { id: "courses", label: "COURSE SELECTION", icon: BookOpen },
    { id: "notes", label: "NOTES & VIDEO ARCHIVE", icon: FileText },
    { id: "fees", label: "FEES & PAYMENT PORTAL", icon: DollarSign },
    { id: "notices", label: "NOTICE BOARD", icon: Bell },
  ];

  return (
    <div className="space-y-8">
      {/* Top Bold Header Banner */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-6 gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
              STUDENT ACADEMIC PORTAL
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              ROLL: {user?.rollNumber || "CS2026-042"}
            </span>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-black m-0 font-sans">
            STUDENT <br />
            PORTAL
          </h1>
        </div>

        <div className="text-left md:text-right bg-white p-4 border-2 border-black space-y-0.5 min-w-[220px]">
          <div className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">
            ENROLLED CANDIDATE
          </div>
          <div className="text-xl font-black uppercase text-black tracking-tight truncate">
            {user?.name || "STUDENT SCHOLAR"}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 uppercase flex items-center md:justify-end gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            CAMPUS NETWORK SYNCED
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 border-2 border-black overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`student-tab-${t.id}`}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2 py-3 px-5 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-black text-white border-2 border-black"
                  : "bg-transparent text-neutral-700 hover:text-black hover:bg-neutral-100 border-2 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-150">
        {activeTab === "live" && <StudentLiveClassroom courses={courses} />}
        {activeTab === "attendance" && <WifiAttendanceTab courses={courses} />}
        {activeTab === "courses" && <CourseEnrollmentTab />}
        {activeTab === "notes" && <StudentNotesLecturesTab courses={courses} />}
        {activeTab === "fees" && <StudentFeesTab />}
        {activeTab === "notices" && <StudentNoticesTab />}
      </div>
    </div>
  );
};
