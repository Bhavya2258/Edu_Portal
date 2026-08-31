import React, { useState, useEffect } from "react";
import { Course, Quiz, QuizQuestion } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  HelpCircle,
  Plus,
  Clock,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  Radio,
  Send,
  Trash2
} from "lucide-react";

interface LiveQuizManagerTabProps {
  courses: Course[];
}

export const LiveQuizManagerTab: React.FC<LiveQuizManagerTabProps> = ({ courses }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingQuizResults, setViewingQuizResults] = useState<Quiz | null>(null);

  // New Quiz Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(120);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: "q-1",
      question: "Which WebRTC signaling protocol is used for session description exchange?",
      options: ["SDP (Session Description Protocol)", "HTTP Basic Auth", "MQTT PubSub", "REST JSON-RPC"],
      correctOptionIndex: 0,
      points: 5,
    },
    {
      id: "q-2",
      question: "What mechanism is used to bypass NATs and firewalls in WebRTC peer connections?",
      options: ["ICE (STUN/TURN) Candidates", "DNS Over HTTPS", "BGP Anycast Routing", "FTP Active Mode"],
      correctOptionIndex: 0,
      points: 5,
    },
  ]);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const list = await api.getQuizzes(selectedCourseId || undefined);
      setQuizzes(list);
    } catch (e) {
      console.error("Failed to load quizzes", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [selectedCourseId]);

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      points: 5,
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedCourseId) return;

    try {
      await api.createQuiz({
        courseId: selectedCourseId,
        title,
        description,
        durationSeconds: Number(durationSeconds),
        questions,
        createdBy: user?.id || "usr-teacher-1",
      });

      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      loadQuizzes();
    } catch (e) {
      alert("Failed to create quiz");
    }
  };

  const handlePushQuizLive = async (quizId: string) => {
    try {
      await api.pushQuizLive(quizId);
      alert("Quiz pushed live to classroom! Students can now answer in real-time.");
      loadQuizzes();
    } catch (e: any) {
      alert("Failed to push quiz: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Live Class Quizzes & Auto-Graded Assignments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Design timed interactive MCQ assessments, push them live to students during lectures, and view real-time scoreboards.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assessment</span>
        </button>
      </div>

      {/* Course Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-2 text-xs">
        <span className="font-semibold text-slate-700">Course Filter:</span>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium max-w-xs"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((q) => {
          const totalPoints = q.questions.reduce((acc, curr) => acc + curr.points, 0);
          const submissionsCount = q.submissions?.length || 0;

          return (
            <div
              key={q.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center space-x-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      q.isLive
                        ? "bg-rose-100 text-rose-800 animate-pulse border border-rose-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {q.isLive && <Radio className="w-2.5 h-2.5 text-rose-600" />}
                    <span>{q.isLive ? "Active in Live Classroom" : "Draft / Ready"}</span>
                  </span>

                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {q.durationSeconds}s Timer
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{q.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {q.description || "Timed multiple-choice evaluation for live comprehension."}
                </p>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs mb-4">
                  <div>
                    <p className="font-bold text-slate-900">{q.questions.length}</p>
                    <p className="text-[10px] text-slate-400">Questions</p>
                  </div>
                  <div>
                    <p className="font-bold text-indigo-600">{totalPoints}</p>
                    <p className="text-[10px] text-slate-400">Total Points</p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-600">{submissionsCount}</p>
                    <p className="text-[10px] text-slate-400">Submissions</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingQuizResults(q)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Student Grades</span>
                </button>

                <button
                  onClick={() => handlePushQuizLive(q.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Push to Live Class</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submissions / Scoreboard Modal */}
      {viewingQuizResults && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assessment Results: {viewingQuizResults.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Auto-graded submissions & real-time student performance
                </p>
              </div>
              <button
                onClick={() => setViewingQuizResults(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {(!viewingQuizResults.submissions || viewingQuizResults.submissions.length === 0) ? (
                <p className="text-center py-12 text-slate-400">
                  No students have submitted responses yet. Push this quiz during a live session to gather real-time answers.
                </p>
              ) : (
                <div className="space-y-3">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-[11px] text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-2">Student</th>
                        <th className="px-3 py-2">Score</th>
                        <th className="px-3 py-2">Percentage</th>
                        <th className="px-3 py-2">Submitted Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {viewingQuizResults.submissions.map((sub) => {
                        const pct = Math.round((sub.score / sub.maxScore) * 100);
                        return (
                          <tr key={sub.studentId} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5">
                              <p className="font-bold text-slate-900">{sub.studentName}</p>
                              <p className="text-[10px] text-slate-400">{sub.studentId}</p>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-indigo-700">
                              {sub.score} / {sub.maxScore}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pct >= 80
                                    ? "bg-emerald-100 text-emerald-800"
                                    : pct >= 50
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {pct}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                              {new Date(sub.submittedAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Create Live Class MCQ Quiz</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-semibold text-slate-700 mb-1">Timer Duration (Seconds)</label>
                  <input
                    type="number"
                    min="30"
                    max="600"
                    step="15"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pop Quiz: WebRTC ICE Negotiation & DataChannels"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              {/* Questions List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Questions ({questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Question</span>
                  </button>
                </div>

                {questions.map((q, qIndex) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Question {qIndex + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Type the question text..."
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIndex, "question", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                    />

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-slate-600">
                        Options (select the radio button next to the correct answer):
                      </p>
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctOptionIndex === optIndex}
                            onChange={() => handleUpdateQuestion(qIndex, "correctOptionIndex", optIndex)}
                            className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                  Save & Publish Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
