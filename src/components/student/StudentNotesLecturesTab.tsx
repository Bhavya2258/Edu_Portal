import React, { useState, useEffect } from "react";
import { Course, CourseNote, RecordedLecture } from "../../types";
import { api } from "../../services/api";
import { VideoPlayerModal } from "../common/VideoPlayerModal";
import {
  FileText,
  Video,
  Download,
  Play,
  Calendar,
  Layers,
  Search,
  BookOpen,
  Sparkles,
  FileCode,
  FileImage
} from "lucide-react";

interface StudentNotesLecturesTabProps {
  courses: Course[];
}

export const StudentNotesLecturesTab: React.FC<StudentNotesLecturesTabProps> = ({ courses }) => {
  const [selectedSubTab, setSelectedSubTab] = useState<"notes" | "lectures">("notes");
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [lectures, setLectures] = useState<RecordedLecture[]>([]);
  const [activeVideo, setActiveVideo] = useState<RecordedLecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [notesData, lecturesData] = await Promise.all([
        api.getNotes({ courseId: selectedCourseId || undefined }),
        api.getLectures(selectedCourseId || undefined),
      ]);
      setNotes(notesData);
      setLectures(lecturesData);
    } catch (e) {
      console.error("Failed to load study materials", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourseId]);

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-rose-500" />;
      case "image":
        return <FileImage className="w-5 h-5 text-emerald-500" />;
      case "code":
        return <FileCode className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Academic Notes & Recorded Lecture Archive
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download daily class notes, PDFs, code repositories, and watch video recordings from past live WebRTC lectures.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSelectedSubTab("notes")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              selectedSubTab === "notes" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Course Notes ({notes.length})</span>
          </button>
          <button
            onClick={() => setSelectedSubTab("lectures")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              selectedSubTab === "lectures" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Recorded Lectures ({lectures.length})</span>
          </button>
        </div>
      </div>

      {/* Course Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-2 text-xs">
        <span className="font-semibold text-slate-700">Course Filter:</span>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium max-w-xs"
        >
          <option value="">All My Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Content View */}
      {selectedSubTab === "notes" ? (
        // Notes Section
        notes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No notes uploaded for this course yet.</p>
            <p className="mt-1">Faculty uploads lecture slides and reference notes periodically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      {getFileTypeIcon(note.fileType)}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {note.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">{note.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {note.description || "Course document reference and slides."}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-600 mb-3">
                    <span className="font-mono truncate max-w-[150px]">{note.fileName}</span>
                    <span className="font-bold text-slate-700">{note.fileSize}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">By {note.uploadedByName}</span>
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Recorded Lectures Section
        lectures.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <Video className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No recorded lectures found.</p>
            <p className="mt-1">Live classes are automatically recorded and published here for on-demand review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lectures.map((lec) => (
              <div
                key={lec.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => setActiveVideo(lec)}
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
                      {lec.summary || "Full lecture recording."}
                    </p>

                    {lec.keyTakeaways && lec.keyTakeaways.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Highlights:</p>
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
                  <button
                    onClick={() => setActiveVideo(lec)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Watch Lecture
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Video Modal */}
      {activeVideo && (
        <VideoPlayerModal
          lecture={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
};
