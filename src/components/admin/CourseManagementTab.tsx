import React, { useState, useEffect } from "react";
import { Course, User } from "../../types";
import { api } from "../../services/api";
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Clock,
  Radio,
  FileText,
  Video,
  Trash2,
  Edit,
  GraduationCap
} from "lucide-react";

export const CourseManagementTab: React.FC = () => {
  const [courses, setCourses] = useState<(Course & { isLiveNow?: boolean; notesCount?: number; lecturesCount?: number })[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New course form
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [semester, setSemester] = useState("Semester 6");
  const [credits, setCredits] = useState(4);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coursesData, usersData] = await Promise.all([
        api.getCourses(),
        api.getUsers({ role: "teacher", status: "approved" }),
      ]);
      setCourses(coursesData);
      setTeachers(usersData);
      if (usersData.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(usersData[0].id);
      }
    } catch (e) {
      console.error("Failed to load courses data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !title) return;
    try {
      await api.createCourse({
        code,
        title,
        description,
        department,
        semester,
        credits: Number(credits),
        teacherId: selectedTeacherId || (teachers[0]?.id || "usr-teacher-1"),
      });
      setShowCreateModal(false);
      setCode("");
      setTitle("");
      setDescription("");
      loadData();
    } catch (e) {
      alert("Failed to create course");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Delete this course and its associated lectures/notes?")) {
      await api.deleteCourse(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Course Catalog & Faculty Assignment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create institutional academic courses, assign faculty instructors, and track live session activity.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
          >
            {/* Header banner */}
            <div className="p-4 bg-slate-900 text-white relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                  {c.code}
                </span>
                {c.isLiveNow ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <Radio className="w-2.5 h-2.5" />
                    <span>Live Class Active</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-300 font-medium">
                    {c.credits} Credits • {c.semester}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-2 line-clamp-1">{c.title}</h3>
              <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">{c.description}</p>
            </div>

            {/* Body Info */}
            <div className="p-4 space-y-3 flex-1 text-xs">
              {/* Teacher chip */}
              <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <img
                  src={c.teacherAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.teacherName}`}
                  alt={c.teacherName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Assigned Faculty</p>
                  <p className="font-bold text-slate-900 truncate">{c.teacherName}</p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-slate-600">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Users className="w-3.5 h-3.5 mx-auto text-indigo-600 mb-0.5" />
                  <p className="font-bold text-slate-900">{c.enrolledStudentIds?.length || 0}</p>
                  <p className="text-[10px] text-slate-500">Enrolled</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <FileText className="w-3.5 h-3.5 mx-auto text-blue-600 mb-0.5" />
                  <p className="font-bold text-slate-900">{c.notesCount || 0}</p>
                  <p className="text-[10px] text-slate-500">Notes</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Video className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <p className="font-bold text-slate-900">{c.lecturesCount || 0}</p>
                  <p className="text-[10px] text-slate-500">Lectures</p>
                </div>
              </div>

              {/* Schedule listing */}
              {c.schedule && c.schedule.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Class Schedule</p>
                  {c.schedule.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>{s.day} ({s.startTime} - {s.endTime})</span>
                      <span className="font-medium text-slate-800">{s.room}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">{c.department}</span>
              <button
                onClick={() => handleDeleteCourse(c.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove course"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Create Academic Course</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-305"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scalable Microservices & Distributed Caching"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Syllabus</label>
                <textarea
                  rows={2}
                  placeholder="Course summary, topics covered, learning outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Computer Science & Engineering">Computer Science</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Electronics & Communication">Electronics</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Faculty Instructor</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  Create & Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
