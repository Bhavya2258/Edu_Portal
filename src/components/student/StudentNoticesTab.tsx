import React, { useState, useEffect } from "react";
import { Notice, NoticePriority } from "../../types";
import { api } from "../../services/api";
import {
  Bell,
  Pin,
  Calendar,
  Filter,
  Sparkles,
  Info,
  AlertTriangle
} from "lucide-react";

export const StudentNoticesTab: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const list = await api.getNotices();
        // Show notices targeted for all or students
        const filtered = list.filter((n) => n.targetRole === "all" || n.targetRole === "students");
        setNotices(filtered);
      } catch (e) {
        console.error("Failed to load student notices", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const getPriorityStyle = (p: NoticePriority) => {
    switch (p) {
      case "urgent":
        return { bg: "bg-rose-50 border-rose-200", badge: "bg-rose-600 text-white" };
      case "event":
        return { bg: "bg-purple-50 border-purple-200", badge: "bg-purple-600 text-white" };
      case "academic":
        return { bg: "bg-blue-50 border-blue-200", badge: "bg-blue-600 text-white" };
      default:
        return { bg: "bg-slate-50 border-slate-200", badge: "bg-slate-700 text-white" };
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (priorityFilter === "all") return true;
    return n.priority === priorityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Notice Board & Bulletins
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official announcements, examination schedules, campus events, and academic guidelines from university administration.
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">All Bulletins</option>
            <option value="urgent">Urgent Alerts</option>
            <option value="academic">Academic Notices</option>
            <option value="event">Campus Events</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {filteredNotices.map((n) => {
          const style = getPriorityStyle(n.priority);

          return (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all bg-white shadow-xs ${
                n.pinned ? "border-amber-300 ring-1 ring-amber-200/70" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  {n.pinned && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                      <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
                      <span>Pinned Announcement</span>
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${style.badge}`}>
                    {n.priority}
                  </span>
                  {n.courseCode && (
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">
                      {n.courseCode}
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400 font-medium">
                  {new Date(n.date).toLocaleDateString()}
                </span>
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
    </div>
  );
};
