import React, { useState, useEffect } from "react";
import { Course } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  CheckCircle2,
  Plus,
  Clock,
  Users,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers
} from "lucide-react";

export const CourseEnrollmentTab: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const all = await api.getCourses();
      setCourses(all);
    } catch (e) {
      console.error("Failed to load courses", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleToggleEnroll = async (course: Course) => {
    if (!user) return;
    const isEnrolled = course.enrolledStudentIds?.includes(user.id);
    try {
      if (isEnrolled) {
        await api.unenrollCourse(course.id);
      } else {
        await api.enrollCourse(course.id);
      }
      loadCourses();
    } catch (e) {
      alert("Failed to update enrollment");
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (departmentFilter === "all") return true;
    return c.department.toLowerCase().includes(departmentFilter.toLowerCase());
  });

  const enrolledCount = courses.filter((c) => c.enrolledStudentIds?.includes(user?.id || "")).length;
  const totalCredits = courses
    .filter((c) => c.enrolledStudentIds?.includes(user?.id || ""))
    .reduce((acc, c) => acc + c.credits, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Academic Course Selection & Enrollment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse departmental course offerings, register for semester modules, and plan your academic credit load.
          </p>
        </div>

        {/* Enrollment Summary Pill */}
        <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 p-2 rounded-xl text-xs">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-indigo-900">
            {enrolledCount} Courses Enrolled ({totalCredits} Credits)
          </span>
        </div>
      </div>

      {/* Department Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-2 text-xs">
        <span className="font-semibold text-slate-700">Filter Department:</span>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
        >
          <option value="all">All Academic Departments</option>
          <option value="computer">Computer Science & Engineering</option>
          <option value="data">Data Science & AI</option>
          <option value="electronics">Electronics & Communication</option>
        </select>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((c) => {
          const isEnrolled = c.enrolledStudentIds?.includes(user?.id || "");

          return (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                isEnrolled ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200"
              }`}
            >
              <div>
                {/* Course Header Banner */}
                <div className="p-4 bg-slate-900 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <span className="text-xs font-semibold text-indigo-200">
                      {c.credits} Credits • {c.semester}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-2 line-clamp-1">{c.title}</h3>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">{c.description}</p>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Teacher Info */}
                  <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <img
                      src={c.teacherAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.teacherName}`}
                      alt={c.teacherName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Faculty Instructor</p>
                      <p className="font-bold text-slate-900 truncate">{c.teacherName}</p>
                    </div>
                  </div>

                  {/* Schedule */}
                  {c.schedule && c.schedule.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Class Timings</p>
                      {c.schedule.map((s, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-600">
                          <span>{s.day} ({s.startTime} - {s.endTime})</span>
                          <span className="font-semibold text-slate-800">{s.room}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">{c.department}</span>
                <button
                  id={`btn-enroll-${c.id}`}
                  onClick={() => handleToggleEnroll(c)}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs ${
                    isEnrolled
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isEnrolled ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Drop Course</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Enroll in Course</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
