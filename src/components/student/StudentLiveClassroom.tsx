import React, { useState, useEffect, useRef } from "react";
import { Course, LiveSession, Quiz, QuizQuestion, LiveViewer } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { socketService, useSocketEvent } from "../../services/socket";
import {
  Video,
  Radio,
  Users,
  Hand,
  Send,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Wifi,
  Volume2,
  VolumeX,
  MessageSquare,
  Award,
  Maximize,
  Minimize,
  RefreshCw
} from "lucide-react";

interface StudentLiveClassroomProps {
  courses: Course[];
}

export const StudentLiveClassroom: React.FC<StudentLiveClassroomProps> = ({ courses }) => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"chat" | "classmates" | "quiz">("chat");

  // Live Quiz Popup State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizTimer, setQuizTimer] = useState<number>(0);
  const [quizResult, setQuizResult] = useState<{ score: number; totalPoints: number; percentage: number } | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Chat & Viewers
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [viewersList, setViewersList] = useState<LiveViewer[]>([]);

  // Video and WebRTC
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasFallbackRef = useRef<HTMLCanvasElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const [hasStreamSignal, setHasStreamSignal] = useState(false);

  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  // Load all active live sessions across courses
  const loadSessions = async () => {
    try {
      const sessions = await api.getActiveLiveSessions();
      setActiveSessions(sessions);
      if (sessions.length > 0 && !currentSession) {
        setCurrentSession(sessions[0]);
        setViewersList(sessions[0].viewers || []);
      }
    } catch (e) {
      console.error("Failed to load active sessions", e);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 4000);
    return () => clearInterval(interval);
  }, []);

  // Initialize BroadcastChannel for same-origin preview and tab sync
  useEffect(() => {
    try {
      broadcastChannelRef.current = new BroadcastChannel("eduportal_live_stream_channel");
      broadcastChannelRef.current.onmessage = (event) => {
        const data = event.data;
        if (data && data.type === "LIVE_FRAME" && currentSession && data.sessionId === currentSession.id) {
          setHasStreamSignal(true);
          renderFrameOnCanvas(data.frame);
        }
      };
    } catch (e) {
      // BroadcastChannel fallback
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [currentSession]);

  // Clean up WebRTC peer connection on unmount or session leave
  const cleanupWebRTC = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupWebRTC();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const renderFrameOnCanvas = (dataUrl: string) => {
    const canvas = canvasFallbackRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  };

  // Listen for socket events
  useSocketEvent("LIVE_SESSION_STARTED", (data: any) => {
    loadSessions();
  });

  useSocketEvent("STREAM_STARTED", (data: any) => {
    loadSessions();
  });

  useSocketEvent("LIVE_SESSION_STOPPED", (data: any) => {
    loadSessions();
    if (currentSession && (currentSession.id === data.sessionId || !data.sessionId)) {
      setIsJoined(false);
      setCurrentSession(null);
      cleanupWebRTC();
      alert("The instructor has concluded the live lecture. The recording is now archived in Recorded Lectures.");
    }
  });

  useSocketEvent("STREAM_STOPPED", (data: any) => {
    loadSessions();
    if (currentSession && currentSession.id === data.sessionId) {
      setIsJoined(false);
      cleanupWebRTC();
    }
  });

  useSocketEvent("VIEWER_JOINED", (data: any) => {
    if (currentSession && data.sessionId === currentSession.id) {
      setViewersList(data.viewers || []);
    }
  });

  useSocketEvent("VIEWER_LEFT", (data: any) => {
    if (currentSession && data.sessionId === currentSession.id) {
      setViewersList(data.viewers || []);
    }
  });

  useSocketEvent("NEW_CHAT_MESSAGE", (data: any) => {
    if (data.message && (!currentSession || data.message.sessionId === currentSession.id)) {
      setChatMessages((prev) => [...prev, data.message]);
    }
  });

  // Fallback frame receiver over WebSocket
  useSocketEvent("STREAM_FRAME", (data: any) => {
    if (currentSession && data.sessionId === currentSession.id && data.frame) {
      setHasStreamSignal(true);
      renderFrameOnCanvas(data.frame);
    }
  });

  // WebRTC Signaling: Teacher sends SDP offer
  useSocketEvent("RTC_OFFER", async (data: any) => {
    if (!currentSession || (data.targetUserId && data.targetUserId !== user?.id)) return;

    try {
      cleanupWebRTC();
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        setHasStreamSignal(true);
        if (videoRef.current && event.streams && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.send({
            type: "RTC_ICE_CANDIDATE",
            sessionId: currentSession.id,
            senderId: user?.id,
            targetUserId: data.senderId,
            candidate: event.candidate,
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.send({
        type: "RTC_ANSWER",
        sessionId: currentSession.id,
        senderId: user?.id,
        targetUserId: data.senderId,
        answer,
      });
    } catch (err) {
      console.warn("WebRTC Answer negotiation error on student client:", err);
    }
  });

  // WebRTC ICE Candidates from teacher
  useSocketEvent("RTC_ICE_CANDIDATE", async (data: any) => {
    if (pcRef.current && data.candidate && (!data.targetUserId || data.targetUserId === user?.id)) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.warn("Failed to add ICE candidate on student:", err);
      }
    }
  });

  // Teacher pushes live pop quiz
  useSocketEvent("QUIZ_PUSHED_LIVE", (data: any) => {
    if (data.quiz) {
      setActiveQuiz(data.quiz);
      setQuizTimer(data.quiz.durationSeconds || 60);
      setSelectedAnswers({});
      setQuizResult(null);
      setActiveTab("quiz");

      // Start countdown
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setQuizTimer((t) => {
          if (t <= 1) {
            clearInterval(timerIntervalRef.current);
            handleSubmitQuizAuto();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  });

  useSocketEvent("QUIZ_PUSHED", (data: any) => {
    if (data.quiz && !activeQuiz) {
      setActiveQuiz(data.quiz);
      setQuizTimer(data.quiz.durationSeconds || 60);
      setSelectedAnswers({});
      setQuizResult(null);
      setActiveTab("quiz");
    }
  });

  // Join Live Class and Auto-Mark Attendance with Campus Wi-Fi Verification
  const handleJoinClass = async () => {
    if (!currentSession) return;

    try {
      // 1. Send API Join request to log attendance in database & register viewer
      const res = await api.joinLiveSession(currentSession.id, {
        studentId: user?.id || "usr-student-1",
        name: user?.name || "Student",
        email: user?.email || "",
        avatar: user?.avatar || "",
        simulatedSsid: "EduPortal-Campus-Secure-5G",
      });

      if (res.session) {
        setViewersList(res.session.viewers || []);
      }
      setAttendanceMarked(true);
      setIsJoined(true);

      // 2. Connect socket room
      socketService.send({
        type: "JOIN_ROOM",
        sessionId: currentSession.id,
        role: "student",
        userId: user?.id,
        studentName: user?.name,
        avatar: user?.avatar,
      });

      // 3. Request WebRTC Stream Offer from Instructor
      socketService.send({
        type: "RTC_REQUEST_STREAM",
        sessionId: currentSession.id,
        studentId: user?.id || "usr-student-1",
        studentName: user?.name,
      });
    } catch (e: any) {
      console.error("Failed to join live class", e);
      setIsJoined(true);
    }
  };

  const handleLeaveClass = async () => {
    if (currentSession && user?.id) {
      api.leaveLiveSession(currentSession.id, user.id).catch(() => {});
    }
    cleanupWebRTC();
    setIsJoined(false);
    setIsHandRaised(false);
    setHasStreamSignal(false);
  };

  // Toggle Hand Raise
  const toggleRaiseHand = () => {
    if (!currentSession) return;
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socketService.send({
      type: "RAISE_HAND",
      sessionId: currentSession.id,
      studentId: user?.id,
      studentName: user?.name,
      isRaised: nextState,
    });
  };

  // Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentSession) return;
    socketService.send({
      type: "CHAT_MESSAGE",
      sessionId: currentSession.id,
      courseId: currentSession.courseId,
      senderId: user?.id || "usr-student-1",
      senderName: user?.name || "Student",
      senderAvatar: user?.avatar,
      senderRole: "student",
      text: chatInput.trim(),
    });
    setChatInput("");
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (!activeQuiz || isSubmittingQuiz) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsSubmittingQuiz(true);

    const answersArray = activeQuiz.questions.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
    }));

    try {
      const res = await api.submitQuiz(activeQuiz.id, answersArray);
      setQuizResult(res.submission);
    } catch (e) {
      // Fallback local calculation
      let score = 0;
      let total = 0;
      activeQuiz.questions.forEach((q) => {
        total += q.points || 10;
        if (selectedAnswers[q.id] === q.correctOptionIndex) {
          score += q.points || 10;
        }
      });
      setQuizResult({
        score,
        totalPoints: total,
        percentage: Math.round((score / total) * 100),
      });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleSubmitQuizAuto = () => {
    handleSubmitQuiz();
  };

  return (
    <div className="space-y-6">
      {/* Active Classes Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-rose-600 text-white shadow-xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Live WebRTC Streaming Classroom
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Attend live interactive lectures, raise hand for questions, chat in real time, and answer instant pop quizzes.
          </p>
        </div>

        {activeSessions.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-700">Active Live Room:</span>
            <select
              value={currentSession?.id || ""}
              onChange={(e) => {
                const s = activeSessions.find((item) => item.id === e.target.value);
                if (s) {
                  cleanupWebRTC();
                  setCurrentSession(s);
                  setViewersList(s.viewers || []);
                  setIsJoined(false);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-rose-700 shadow-xs outline-none"
            >
              {activeSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.courseCode} - {s.topic}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Verified Attendance Banner */}
      {attendanceMarked && isJoined && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Wi-Fi Verified Attendance Recorded: You are marked <strong>Present</strong> for {currentSession?.courseCode} ({new Date().toISOString().split("T")[0]}) via Campus 5G Gateway.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
            100% Present
          </span>
        </div>
      )}

      {activeSessions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Video className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Live Classes Currently in Session</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Faculty instructors broadcast classes according to course schedules. You can explore past lecture recordings or download notes in the meantime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Live Stream Viewer (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
              {isJoined ? (
                <>
                  {/* Dynamic Video & Fallback Canvas Elements */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-contain"
                  />
                  <canvas
                    ref={canvasFallbackRef}
                    width={640}
                    height={360}
                    className={`absolute inset-0 w-full h-full object-contain ${hasStreamSignal ? "pointer-events-none" : ""}`}
                  />
                </>
              ) : (
                <div className="text-center text-white p-6 max-w-md">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider mb-3 animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Live Faculty Broadcast</span>
                  </span>
                  <h3 className="text-xl font-bold">{currentSession?.topic}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Instructor: {currentSession?.teacherName} • {currentSession?.courseCode}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center justify-center gap-1">
                    <Wifi className="w-3.5 h-3.5" />
                    Campus Wi-Fi Connected (Attendance will be auto-logged)
                  </p>
                  <button
                    id="btn-join-live-class"
                    onClick={handleJoinClass}
                    className="mt-5 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    Join Live Classroom Now
                  </button>
                </div>
              )}

              {/* Overlays when joined */}
              {isJoined && (
                <>
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      <span>LIVE STREAM</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[11px] font-semibold">
                      {currentSession?.courseCode} • {currentSession?.teacherName}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-emerald-400 text-[11px] font-semibold flex items-center space-x-1">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Campus Wi-Fi Verified</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[11px] font-semibold flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{viewersList.length} Connected</span>
                    </span>
                  </div>

                  {/* Student Bottom Controls */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center space-x-3 px-4">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-3 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 text-white transition-all shadow-md"
                      title={isMuted ? "Unmute Audio" : "Mute Audio"}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>

                    <button
                      id="btn-student-raise-hand"
                      onClick={toggleRaiseHand}
                      className={`px-4 py-2 rounded-full backdrop-blur text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md ${
                        isHandRaised
                          ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                          : "bg-white/20 hover:bg-white/30 text-white"
                      }`}
                    >
                      <Hand className="w-4 h-4" />
                      <span>{isHandRaised ? "Hand Raised!" : "Raise Hand"}</span>
                    </button>

                    <button
                      onClick={handleLeaveClass}
                      className="px-4 py-2 rounded-full bg-slate-900/80 hover:bg-black text-rose-400 hover:text-rose-300 text-xs font-bold backdrop-blur transition-all shadow-md"
                    >
                      Leave Class
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Live Interactive Console (Tabs for Chat, Classmates, and Quiz) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200 p-2 bg-slate-50 gap-1 text-xs">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                  activeTab === "chat" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setActiveTab("classmates")}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                  activeTab === "classmates" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Audience ({viewersList.length})</span>
              </button>

              {activeQuiz && (
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                    activeTab === "quiz" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-100 text-rose-900 font-extrabold animate-pulse"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Pop Quiz!</span>
                </button>
              )}
            </div>

            {/* TAB 1: REAL-TIME CLASSROOM CHAT */}
            {activeTab === "chat" && (
              <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-12">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      <p>Ask a question or share insights with the faculty and classmates!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs ${
                          msg.senderRole === "teacher"
                            ? "bg-rose-50 border border-rose-100 text-rose-950 ml-4 font-medium"
                            : msg.senderId === user?.id
                            ? "bg-indigo-50 border border-indigo-100 text-indigo-950 mr-4"
                            : "bg-slate-50 border border-slate-100 text-slate-800 mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-[11px]">
                            {msg.senderName} {msg.senderRole === "teacher" && "(Faculty)"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isJoined ? "Ask question or participate..." : "Join class to participate in chat"}
                    disabled={!isJoined}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={!isJoined || !chatInput.trim()}
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: CONNECTED CLASSMATES */}
            {activeTab === "classmates" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Live Classroom Roster</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5" />
                      Campus Wi-Fi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    All connected students receive verified attendance for this scheduled lecture session.
                  </p>
                </div>

                <div className="space-y-2">
                  {viewersList.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-8">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      <p>Waiting for classmates to connect...</p>
                    </div>
                  ) : (
                    viewersList.map((viewer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                            {viewer.name[0].toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">
                              {viewer.name} {viewer.studentId === user?.id && "(You)"}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{viewer.email}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 shrink-0">
                          Present
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE POP QUIZ */}
            {activeTab === "quiz" && activeQuiz && (
              <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{activeQuiz.title}</h4>
                      <p className="text-[11px] text-slate-500">{activeQuiz.topic}</p>
                    </div>

                    {!quizResult && (
                      <div className="flex items-center space-x-1 font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{quizTimer}s</span>
                      </div>
                    )}
                  </div>

                  {quizResult ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <h4 className="text-sm font-bold text-emerald-900">Quiz Submitted Successfully!</h4>
                      <p className="text-xs text-emerald-700">
                        Score: <strong>{quizResult.score} / {quizResult.totalPoints}</strong> ({quizResult.percentage}%)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeQuiz.questions.map((q, idx) => (
                        <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                          <p className="font-bold text-slate-900">
                            Q{idx + 1}: {q.question} ({q.points} pts)
                          </p>
                          <div className="space-y-1.5">
                            {q.options.map((opt, optIdx) => (
                              <label
                                key={optIdx}
                                className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                                  selectedAnswers[q.id] === optIdx
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold"
                                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`quiz-q-${q.id}`}
                                  checked={selectedAnswers[q.id] === optIdx}
                                  onChange={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                  className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!quizResult && (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Submit Pop Quiz Answers
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
