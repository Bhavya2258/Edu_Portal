import React, { useState, useEffect } from "react";
import { InstitutionAnalytics } from "../../types";
import { api } from "../../services/api";
import {
  BarChart3,
  TrendingUp,
  Users,
  GraduationCap,
  BookOpen,
  Radio,
  DollarSign,
  Wifi,
  Activity,
  CheckCircle2
} from "lucide-react";

export const AnalyticsTab: React.FC = () => {
  const [analytics, setAnalytics] = useState<InstitutionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading institutional intelligence...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
            METRICS & AUDIT LOGS
          </span>
          <h2 className="text-3xl font-black text-black uppercase tracking-tight">
            Institutional Intelligence
          </h2>
        </div>
        <p className="text-xs text-neutral-600 font-medium">
          Live Wi-Fi attendance compliance, WebRTC room status, and enrollment figures.
        </p>
      </div>

      {/* Primary KPI Grid (High impact bold typography cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-black p-6 space-y-2">
          <div className="text-[11px] font-black text-neutral-500 uppercase tracking-wider">
            Total Students
          </div>
          <div className="text-5xl font-black tracking-tighter text-black">
            {analytics.totalStudents.toLocaleString()}
          </div>
          <div className="text-xs font-black uppercase text-emerald-700">
            +12% THIS SEMESTER
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6 space-y-2">
          <div className="text-[11px] font-black text-neutral-500 uppercase tracking-wider">
            Active Faculty
          </div>
          <div className="text-5xl font-black tracking-tighter text-black">
            {analytics.totalTeachers}
          </div>
          <div className="text-xs font-black uppercase text-neutral-600">
            {analytics.totalCourses} ACTIVE COURSES
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6 space-y-2">
          <div className="text-[11px] font-black text-neutral-500 uppercase tracking-wider">
            Live WebRTC Rooms
          </div>
          <div className="text-5xl font-black tracking-tighter text-black">
            {analytics.activeLiveClassesCount}
          </div>
          <div className="text-xs font-black uppercase text-rose-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            BROADCASTING NOW
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6 space-y-2">
          <div className="text-[11px] font-black text-neutral-500 uppercase tracking-wider">
            Avg Attendance
          </div>
          <div className="text-5xl font-black tracking-tighter text-black">
            {analytics.overallAttendanceAverage}%
          </div>
          <div className="text-xs font-black uppercase text-neutral-800">
            WI-FI SUBNET VERIFIED
          </div>
        </div>
      </div>

      {/* Department Breakdown & Attendance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Performance */}
        <div className="bg-white border-2 border-black p-6 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="text-base font-black text-black uppercase tracking-tight">
              Department Attendance Compliance
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">
              CAMPUS WI-FI
            </span>
          </div>

          <div className="space-y-5">
            {analytics.departmentStats.map((dept) => (
              <div key={dept.department} className="space-y-2 border-b border-neutral-200 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-xs font-black uppercase">
                  <span className="text-black">{dept.department}</span>
                  <span className="text-black text-sm">{dept.avgAttendance}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-3 bg-neutral-200 border border-black overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${dept.avgAttendance}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 uppercase">
                  <span>{dept.studentsCount} STUDENTS</span>
                  <span>{dept.coursesCount} COURSES</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log / Recent Institutional Activity */}
        <div className="bg-white border-2 border-black p-6 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="text-base font-black text-black uppercase tracking-tight">
              System Audit Trail
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2 py-0.5">
              LIVE STREAM
            </span>
          </div>

          <div className="space-y-3">
            {analytics.recentActivity.map((act) => (
              <div key={act.id} className="p-3.5 bg-neutral-50 border border-black text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-black text-black uppercase tracking-tight">{act.title}</p>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">{act.timestamp}</span>
                </div>
                <p className="text-[11px] text-neutral-600 font-bold uppercase">{act.user}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
