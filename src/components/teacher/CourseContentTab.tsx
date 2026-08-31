import React, { useState, useEffect } from "react";
import { Course, RecordedLecture } from "../../types";
import { api } from "../../services/api";
import { VideoPlayerModal } from "../common/VideoPlayerModal";
import {
  Video,
  Play,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  BookOpen,
  FileText,
  Sparkles,
  Users
} from "lucide-react";

interface CourseContentTabProps {
  courses: Course[];
}

export const CourseContentTab: React.FC<CourseContentTabProps> = ({ courses }) => {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [lectures, setLectures] = useState<RecordedLecture[]>([]);
  const [activeVideoModal, setActiveVideoModal] = useState<RecordedLecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLectures = async () => {
    setIsLoading(true);
    try {
      const list = await api.getLectures(selectedCourseId || undefined);
      setLectures(list);
    } catch (e) {
      console.error("Failed to load lectures", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLectures();
  }, [selectedCourseId]);

  const handleDeleteLecture = async (id: string) => {
    if (confirm("Delete this recorded lecture from the course archive?")) {
      await api.deleteLecture(id);
      loadLectures();
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Recorded Past Lectures & Course Library
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived video recordings from live WebRTC classroom sessions, categorized chronologically with key takeaways and summaries.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-700">Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium max-w-xs"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lectures Grid */}
      {lectures.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          <Video className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No recorded lectures found for this course.</p>
          <p className="mt-1">
            When you complete a live class in the Live Studio, the video is automatically processed and archived here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lectures.map((lec) => (
            <div
              key={lec.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail / Video Preview Box */}
                <div
                  onClick={() => setActiveVideoModal(lec)}
                  className="relative aspect-video bg-slate-900 cursor-pointer group overflow-hidden"
                >
                  <img
                    src={lec.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600"}
                    alt={lec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-indigo-600 ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur">
                    {lec.duration}
                  </span>
                  <span className="absolute top-2.5 left-2.5 bg-indigo-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    {lec.date}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{lec.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {lec.summary || "Complete live recorded lecture session."}
                  </p>

                  {lec.keyTakeaways && lec.keyTakeaways.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Key Takeaways:</p>
                      {lec.keyTakeaways.slice(0, 2).map((k, i) => (
                        <p key={i} className="text-[11px] text-slate-600 truncate flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                          <span>{k}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">By {lec.uploadedByName}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveVideoModal(lec)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Play Recording
                  </button>
                  <button
                    onClick={() => handleDeleteLecture(lec.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Recording"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideoModal && (
        <VideoPlayerModal
          lecture={activeVideoModal}
          onClose={() => setActiveVideoModal(null)}
        />
      )}
    </div>
  );
};
