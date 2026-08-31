import React, { useState, useRef, useEffect } from "react";
import { RecordedLecture } from "../../types";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface VideoPlayerModalProps {
  lecture: RecordedLecture;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ lecture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lecture.durationSeconds || 180);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "takeaways" | "info">("summary");
  const [videoError, setVideoError] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Fallback interactive animated visualizer if video file fails to load
  useEffect(() => {
    if (!videoError) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient backdrop
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "rgba(79, 70, 229, 0.2)");
      grad.addColorStop(1, "rgba(225, 29, 72, 0.15)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title & Topic
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(lecture.title, 32, 60);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`Recorded Lecture • ${lecture.topic}`, 32, 90);

      // Audio waveform bars
      const barCount = 36;
      const barWidth = 8;
      const startX = 32;
      const centerY = 190;

      for (let i = 0; i < barCount; i++) {
        const h = Math.sin((frame * 0.08) + i * 0.3) * 35 + 40;
        ctx.fillStyle = i % 2 === 0 ? "#6366f1" : "#ec4899";
        ctx.fillRect(startX + i * (barWidth + 6), centerY - h / 2, barWidth, h);
      }

      // Instructor tag
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`Lecturer: ${lecture.uploadedByName} | Date: ${lecture.date}`, 32, 270);

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [videoError, isPlaying, lecture]);

  const togglePlay = () => {
    if (videoRef.current && !videoError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => setVideoError(true));
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    } else {
      setCurrentTime((t) => Math.max(0, Math.min(duration, t + seconds)));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        ref={playerContainerRef}
        className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                Recorded Classroom Archive
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {lecture.date}
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {lecture.duration}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{lecture.title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-inner group">
          {!videoError ? (
            <video
              ref={videoRef}
              src={lecture.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setVideoError(true)}
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <canvas ref={canvasRef} width={640} height={360} className="w-full h-full object-contain" />
          )}

          {/* Custom Overlay Controls */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col space-y-2 opacity-95 transition-opacity">
            {/* Scrubber Bar */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-slate-300 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[11px] font-mono text-slate-300 w-10">
                {formatTime(duration)}
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-white text-slate-950 hover:bg-indigo-50 transition-transform active:scale-95 shadow-md"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                </button>

                <button
                  onClick={() => skipTime(-10)}
                  className="text-slate-300 hover:text-white p-1 text-xs flex items-center gap-1 transition-colors"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>10s</span>
                </button>

                <button
                  onClick={() => skipTime(10)}
                  className="text-slate-300 hover:text-white p-1 text-xs flex items-center gap-1 transition-colors"
                  title="Forward 10s"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>10s</span>
                </button>

                <div className="flex items-center space-x-1.5 pl-2">
                  <button onClick={toggleMute} className="text-slate-300 hover:text-white">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Speed Selector */}
                <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs text-white">
                  {[1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        playbackRate === rate ? "bg-indigo-600 text-white" : "hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Notes & Lecture Breakdown Tabbed View */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveTab("summary")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "summary" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Lecture Summary
            </button>
            <button
              onClick={() => setActiveTab("takeaways")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "takeaways" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Key Takeaways ({lecture.keyTakeaways?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "info" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Instructor Details
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 min-h-[90px]">
            {activeTab === "summary" && (
              <p className="leading-relaxed">
                {lecture.summary || "No summary provided for this recorded live session."}
              </p>
            )}

            {activeTab === "takeaways" && (
              <div className="space-y-1.5">
                {lecture.keyTakeaways && lecture.keyTakeaways.length > 0 ? (
                  lecture.keyTakeaways.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No takeaways noted for this lecture.</p>
                )}
              </div>
            )}

            {activeTab === "info" && (
              <div className="space-y-1 text-slate-600">
                <p>
                  <strong>Instructor:</strong> {lecture.uploadedByName}
                </p>
                <p>
                  <strong>Date of Recording:</strong> {lecture.date}
                </p>
                <p>
                  <strong>Total Duration:</strong> {lecture.duration}
                </p>
                <p>
                  <strong>Total Student Views:</strong> {lecture.viewsCount || 1} views
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
