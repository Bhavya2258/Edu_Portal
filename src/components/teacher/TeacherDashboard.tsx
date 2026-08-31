import React, { useState, useEffect } from "react";
import { Course } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { LiveStreamStudio } from "./LiveStreamStudio";
import { NotesUploadTab } from "./NotesUploadTab";
import { LiveQuizManagerTab } from "./LiveQuizManagerTab";
import { CourseContentTab } from "./CourseContentTab";
import {
  Video,
  FileText,
  HelpCircle,
  Film,
  BookOpen,
  Sparkles,
  Users,
  Radio
} from "lucide-react";

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stream" | "notes" | "quizzes" | "lectures">("stream");

  const loadTeacherCourses = async () => {
    setIsLoading(true);
    try {
      const all = await api.getCourses();
      // Filter for this teacher, or show all if assigned
      const myCourses = all.filter((c) => c.teacherId === user?.id || !c.teacherId || all.length <= 4);
      setCourses(myCourses.length > 0 ? myCourses : all);
    } catch (e) {
      console.error("Failed to load teacher courses", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherCourses();
  }, [user]);

  const tabs = [
    { id: "stream", label: "LIVE WEBRTC STUDIO", icon: Video },
    { id: "notes", label: "UPLOAD & MANAGE NOTES", icon: FileText },
    { id: "quizzes", label: "LIVE QUIZZES & GRADING", icon: HelpCircle },
    { id: "lectures", label: "PAST RECORDED LECTURES", icon: Film },
  ];

  return (
    <div className="space-y-8">
      {/* Top Bold Header Banner */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-6 gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
              FACULTY INSTRUCTION CONSOLE
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              {user?.department || "DEPARTMENT OF ENGINEERING"}
            </span>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-black m-0 font-sans">
            FACULTY <br />
            STUDIO
          </h1>
        </div>

        <div className="text-left md:text-right bg-white p-4 border-2 border-black space-y-0.5 min-w-[220px]">
          <div className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">
            ACTIVE INSTRUCTOR
          </div>
          <div className="text-xl font-black uppercase text-black tracking-tight truncate">
            {user?.name || "FACULTY PROFESSOR"}
          </div>
          <div className="text-[11px] font-bold text-rose-600 uppercase flex items-center md:justify-end gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            WEBRTC CAMERA READY
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 border-2 border-black overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`teacher-tab-${t.id}`}
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
        {activeTab === "stream" && (
          <LiveStreamStudio
            courses={courses}
            onLectureSaved={() => {
              // Switch or refresh past lectures tab
            }}
          />
        )}
        {activeTab === "notes" && <NotesUploadTab courses={courses} />}
        {activeTab === "quizzes" && <LiveQuizManagerTab courses={courses} />}
        {activeTab === "lectures" && <CourseContentTab courses={courses} />}
      </div>
    </div>
  );
};
