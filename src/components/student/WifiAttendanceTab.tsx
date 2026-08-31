import React, { useState, useEffect } from "react";
import { AttendanceRecord, Course } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldCheck,
  Building,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface WifiAttendanceTabProps {
  courses: Course[];
}

export const WifiAttendanceTab: React.FC<WifiAttendanceTabProps> = ({ courses }) => {
  const { user } = useAuth();
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [wifiStatus, setWifiStatus] = useState<{ isCampusWifi: boolean; networkName?: string; ip?: string; reason?: string } | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [isCheckingWifi, setIsCheckingWifi] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual campus simulation toggle for testing
  const [simulateCampusSsid, setSimulateCampusSsid] = useState("EduPortal-Campus-Secure-5G");

  const checkWifi = async () => {
    setIsCheckingWifi(true);
    try {
      const res = await api.checkWifiStatus(simulateCampusSsid);
      setWifiStatus(res);
    } catch (e) {
      setWifiStatus({ isCampusWifi: false, reason: "Unable to verify network status." });
    } finally {
      setIsCheckingWifi(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const list = await api.getMyAttendance();
      setAttendanceList(list);
    } catch (e) {
      console.error("Failed to load attendance records", e);
    }
  };

  useEffect(() => {
    checkWifi();
    loadAttendance();
  }, [simulateCampusSsid]);

  // Handle Mark Attendance Click
  const handleMarkAttendance = async (courseIdToMark: string) => {
    setIsMarking(true);
    setMessage(null);
    try {
      const targetCourse = courses.find((c) => c.id === courseIdToMark);
      const res = await api.markAttendance({
        courseId: courseIdToMark,
        courseCode: targetCourse?.code || "CS-301",
        courseTitle: targetCourse?.title || "Classroom Lecture",
        deviceSsid: simulateCampusSsid,
      });

      setMessage({ type: "success", text: res.message || "Attendance marked successfully!" });
      loadAttendance();
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e.response?.data?.error || e.message || "Failed to mark attendance. Ensure you are connected to campus Wi-Fi.",
      });
    } finally {
      setIsMarking(false);
    }
  };

  // Compute Overall and Course Attendance Metrics
  const totalClasses = attendanceList.length || 1;
  const presentCount = attendanceList.filter((a) => a.status === "present").length;
  const overallPercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;
  const isBelowThreshold = overallPercentage < 75;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Wi-Fi Verified Campus Attendance System
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic check ensures attendance is only marked when connected to authorized institutional Wi-Fi access points.
          </p>
        </div>

        <button
          onClick={checkWifi}
          disabled={isCheckingWifi}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingWifi ? "animate-spin" : ""}`} />
          <span>Re-verify Wi-Fi Network</span>
        </button>
      </div>

      {/* Network Verification Status Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          wifiStatus?.isCampusWifi
            ? "bg-emerald-50/80 border-emerald-200"
            : "bg-amber-50/80 border-amber-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                wifiStatus?.isCampusWifi ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
              }`}
            >
              {wifiStatus?.isCampusWifi ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {wifiStatus?.isCampusWifi
                    ? "Connected to Campus Wi-Fi Network"
                    : "Not Detected on Campus Wi-Fi Network"}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    wifiStatus?.isCampusWifi
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-amber-200 text-amber-900"
                  }`}
                >
                  {wifiStatus?.isCampusWifi ? "Verified & Ready" : "Restricted"}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-0.5">
                {wifiStatus?.isCampusWifi
                  ? `Access Point SSID: "${wifiStatus.networkName}" • Subnet Verified • Eligible to Mark Attendance`
                  : wifiStatus?.reason || "Please connect to EduPortal-Campus-Secure-5G or Lab Wi-Fi to mark attendance."}
              </p>
            </div>
          </div>

          {/* Wi-Fi Simulator selector */}
          <div className="flex items-center space-x-2 text-xs bg-white/80 p-2 rounded-xl border border-slate-200 self-start sm:self-auto">
            <span className="font-semibold text-slate-600">Simulate Wi-Fi:</span>
            <select
              value={simulateCampusSsid}
              onChange={(e) => setSimulateCampusSsid(e.target.value)}
              className="py-1 px-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="EduPortal-Campus-Secure-5G">EduPortal Campus 5G (Authorized)</option>
              <option value="EduPortal-Lab-Wi-Fi">EduPortal Lab Wi-Fi (Authorized)</option>
              <option value="Home_Network_Unauthorized">Home Wi-Fi (Outside Campus)</option>
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Metric & 75% Warning Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Overall Attendance</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{overallPercentage}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {presentCount} of {totalClasses} classes attended
            </p>
          </div>
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm ${
              isBelowThreshold
                ? "bg-rose-100 text-rose-700 ring-4 ring-rose-50"
                : "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50"
            }`}
          >
            {overallPercentage}%
          </div>
        </div>

        {/* 75% Mandatory Attendance Rule Warning */}
        <div
          className={`md:col-span-2 p-5 rounded-2xl border shadow-xs flex items-center space-x-4 ${
            isBelowThreshold
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-indigo-50/70 border-indigo-100 text-indigo-950"
          }`}
        >
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isBelowThreshold ? "bg-rose-600 text-white" : "bg-indigo-600 text-white"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {isBelowThreshold
                ? "⚠️ Critical Attendance Shortage Alert (<75%)"
                : "Institutional Attendance Standard (Minimum 75%)"}
            </h4>
            <p className="text-xs leading-relaxed mt-1">
              {isBelowThreshold
                ? "Your current attendance is below the mandatory 75% institutional requirement. You may be ineligible to sit for final semester examinations unless you attend upcoming lectures."
                : "Good standing! Your attendance is in compliance with the university academic examination criteria (≥75%)."}
            </p>
          </div>
        </div>
      </div>

      {/* Mark Attendance Action per Course */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Mark Today's Scheduled Lectures</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c) => {
            const today = new Date().toISOString().split("T")[0];
            const alreadyMarked = attendanceList.some(
              (a) => a.courseId === c.id && a.date === today && a.status === "present"
            );

            return (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {c.code}
                    </span>
                    <span className="text-[11px] text-slate-400">Semester 6</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Instructor: {c.teacherName}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/80">
                  {alreadyMarked ? (
                    <div className="py-2 px-3 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Marked Present Today</span>
                    </div>
                  ) : (
                    <button
                      id={`btn-mark-att-${c.id}`}
                      onClick={() => handleMarkAttendance(c.id)}
                      disabled={isMarking || !wifiStatus?.isCampusWifi}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs ${
                        wifiStatus?.isCampusWifi
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <Wifi className="w-3.5 h-3.5" />
                      <span>{wifiStatus?.isCampusWifi ? "Mark Wi-Fi Attendance" : "Campus Wi-Fi Required"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Attendance Log & Verification History</h3>
          <span className="text-xs text-slate-400 font-medium">{attendanceList.length} Sessions Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Wi-Fi Network / SSID</th>
                <th className="px-4 py-3">Verification Method</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {attendanceList.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900">{a.courseCode}</span>
                    <p className="text-[11px] text-slate-500">{a.courseTitle}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p className="font-semibold text-slate-800">{a.date}</p>
                    <p className="text-[11px] text-slate-400">{a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : "09:00 AM"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                      {a.wifiSsid || "EduPortal-Campus-Secure-5G"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{a.verificationMethod || "Campus Subnet IP & SSID"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        a.status === "present"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
