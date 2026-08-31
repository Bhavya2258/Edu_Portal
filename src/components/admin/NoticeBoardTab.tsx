import React, { useState, useEffect } from "react";
import { Notice, NoticePriority } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Bell,
  Plus,
  Pin,
  AlertCircle,
  Calendar,
  Sparkles,
  Trash2,
  Send,
  Flag,
  Users
} from "lucide-react";

export const NoticeBoardTab: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New notice state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<NoticePriority>("general");
  const [targetRole, setTargetRole] = useState<"all" | "students" | "teachers">("all");
  const [pinned, setPinned] = useState(false);

  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const list = await api.getNotices();
      setNotices(list);
    } catch (e) {
      console.error("Failed to load notices", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice迷 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      await api.createNotice({
        title,
        content,
        priority,
        targetRole,
        pinned,
        authorId: user?.id || "usr-admin-1",
        authorName: user?.name || "Administration",
        authorRole: "Admin",
      });
      setShowCreateModal(false);
      setTitle("");
      setContent("");
      setPinned(false);
      loadNotices();
    } catch (e) {
      alert("Failed to publish notice");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (confirm("Delete this announcement?")) {
      await api.deleteNotice(id);
      loadNotices();
    }
  };

  const getPriorityStyle = (p: NoticePriority) => {
    switch (p) {
      case "urgent":
        return { bg: "bg-rose-50 text-rose-700 border-rose-200", badge: "bg-rose-600 text-white" };
      case "event":
        return { bg: "bg-purple-50 text-purple-700 border-purple-200", badge: "bg-purple-600 text-white" };
      case "academic":
        return { bg: "bg-blue-50 text-blue-700 border-blue-200", badge: "bg-blue-600 text-white" };
      default:
        return { bg: "bg-slate-50 text-slate-700 border-slate-200", badge: "bg-slate-600 text-white" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Notice Board & Bulletins
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast emergency alerts, academic guidelines, exam schedules, and events to students and faculty.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Announcement</span>
        </button>
      </div>

      {/* Notices Feed */}
      <div className="space-y-3.5">
        {notices.map((n) => {
          const style = getPriorityStyle(n.priority);
          return (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all bg-white shadow-xs ${
                n.pinned ? "border-amber-300 ring-1 ring-amber-200/60" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  {n.pinned && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                      <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
                      <span>Pinned Broadcast</span>
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${style.badge}`}>
                    {n.priority}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                    Target: {n.targetRole === "all" ? "All Users" : n.targetRole}
                  </span>
                  {n.courseCode && (
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">
                      {n.courseCode}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(n.date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteNotice(n.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded"
                    title="Delete notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1.5">{n.title}</h3>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{n.content}</p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-slate-700">{n.authorName}</span>
                  <span>({n.authorRole})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Post Institutional Notice</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice迷} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Headline Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Semester Laboratory Guidelines & Wi-Fi Attendance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Announcement Body</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed institutional announcement message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Classification</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NoticePriority)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white capitalize"
                  >
                    <option value="general">General Notice</option>
                    <option value="urgent">Urgent / Emergency</option>
                    <option value="academic">Academic Guideline</option>
                    <option value="event">Campus Event</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="all">All Users (Students + Faculty)</option>
                    <option value="students">Students Only</option>
                    <option value="teachers">Faculty / Teachers Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pin-notice"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="pin-notice" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Pin this announcement to the top of all user dashboards
                </label>
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
