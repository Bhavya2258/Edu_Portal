import React, { useState, useEffect } from "react";
import { Course, CourseNote } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  FileText,
  Upload,
  Calendar,
  Download,
  Trash2,
  Plus,
  Filter,
  CheckCircle2,
  FileCode,
  FileImage,
  Layers,
  Paperclip
} from "lucide-react";

interface NotesUploadTabProps {
  courses: Course[];
}

export const NotesUploadTab: React.FC<NotesUploadTabProps> = ({ courses }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileType, setUploadFileType] = useState<"pdf" | "doc" | "image" | "code">("pdf");
  const [uploadFileSize, setUploadFileSize] = useState("2.4 MB");

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const list = await api.getNotes({
        courseId: selectedCourseId || undefined,
        date: dateFilter || undefined,
      });
      setNotes(list);
    } catch (e) {
      console.error("Failed to load notes", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [selectedCourseId, dateFilter]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") setUploadFileType("pdf");
      else if (["jpg", "jpeg", "png", "gif", "svg"].includes(ext || "")) setUploadFileType("image");
      else if (["ts", "js", "py", "java", "cpp", "c", "json"].includes(ext || "")) setUploadFileType("code");
      else setUploadFileType("doc");

      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadFileSize(`${sizeInMb} MB`);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !selectedCourseId) return;

    try {
      await api.uploadNote({
        courseId: selectedCourseId,
        title: uploadTitle,
        description: uploadDesc,
        date: uploadDate,
        fileName: uploadFileName || `${uploadTitle.replace(/\s+/g, "_")}.${uploadFileType}`,
        fileType: uploadFileType,
        fileSize: uploadFileSize,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: user?.id || "usr-teacher-1",
        uploadedByName: user?.name || "Faculty Instructor",
      });

      setShowUploadModal(false);
      setUploadTitle("");
      setUploadDesc("");
      setUploadFileName("");
      loadNotes();
    } catch (e) {
      alert("Failed to upload note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Delete this note? Enrolled students will no longer be able to download it.")) {
      await api.deleteNote(id);
      loadNotes();
    }
  };

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
            Course Notes & Document Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload lecture notes, PDFs, code snippets, and study material organized per course and per calendar date.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Notes</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium flex-1 max-w-xs"
          >
            <option value="">All Assigned Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">Filter by Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="text-[11px] text-indigo-600 hover:underline font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No notes found for this course/date filter.</p>
          <p className="mt-1">Click "Upload New Notes" to share materials with your students.</p>
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
                  {note.description || "Lecture slides and study reference material."}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-600 mb-3">
                  <span className="font-mono truncate max-w-[150px]">{note.fileName}</span>
                  <span className="font-bold text-slate-700 shrink-0">{note.fileSize}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">{note.downloadCount || 0} student downloads</span>
                <div className="flex items-center space-x-1">
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Download / View"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Upload Course Material</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Scalable Caching & Redis Replication"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lecture Date</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Format</label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white capitalize"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="doc">Word / Text Doc</option>
                    <option value="image">Diagram / Image</option>
                    <option value="code">Source Code / Lab Script</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Topics Covered</label>
                <textarea
                  rows={2}
                  placeholder="Key concepts, slide deck overview, homework references..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* File Attachment Dropzone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select File</label>
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-colors">
                  <Paperclip className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="font-semibold text-indigo-600">
                    {uploadFileName || "Click to browse PDF / Doc / Image file"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, PNG, JPG, ZIP up to 50MB</span>
                  <input type="file" className="hidden" onChange={handleFileSelect} />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  Upload & Publish to Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
