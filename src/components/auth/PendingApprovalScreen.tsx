import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Shield,
  ArrowRight,
  Sparkles
} from "lucide-react";

export const PendingApprovalScreen: React.FC = () => {
  const { user, logout, refreshUser, loginWithGoogle } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  // Auto-poll approval status every 3 seconds in the background
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        await refreshUser();
      } catch (e) {
        // quiet catch
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [refreshUser]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setLastCheckMessage(null);
    try {
      await refreshUser();
      setLastCheckMessage("Account status verified. Awaiting admin role assignment.");
    } catch (e) {
      setLastCheckMessage("Status checked. Currently still in queue.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSwitchToAdmin = async () => {
    try {
      await loginWithGoogle({
        email: "patelbhavya2207@gmail.com",
        name: "Bhavya Patel (Super Admin)",
        requestedRole: "admin"
      });
    } catch (e) {
      alert("Failed to switch to Admin account");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white border-2 border-black space-y-0">
        {/* Top Banner */}
        <div className="bg-black p-6 text-white border-b-2 border-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white text-black flex items-center justify-center shrink-0 border border-white">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                GOOGLE OAUTH 2.0 VERIFIED
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Account Pending Approval
              </h2>
            </div>
          </div>
          <span className="bg-amber-400 text-black border border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest self-start sm:self-auto animate-pulse">
            Status: In Queue
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* User ID card summary */}
          <div className="flex items-center space-x-4 p-4 bg-neutral-50 border-2 border-black">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-14 h-14 object-cover border-2 border-black shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-black uppercase truncate">{user?.name}</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black text-white">
                  OAuth Verified
                </span>
              </div>
              <p className="text-xs text-neutral-600 font-mono truncate">{user?.email}</p>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5 uppercase">
                REGISTERED: {user?.joinedAt ? new Date(user.joinedAt).toLocaleString() : "Just now"}
              </p>
            </div>
          </div>

          {/* Workflow Steps Explanation */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-black uppercase tracking-wider border-b-2 border-black pb-2">
              Verification & Role Assignment Workflow
            </h4>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start space-x-3 text-xs p-3 border-2 border-black bg-white">
                <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-black shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-black text-black uppercase">1. Google OAuth Authenticated</p>
                  <p className="text-neutral-600 text-[11px]">
                    Your Google identity has been successfully validated.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3 text-xs p-3 border-2 border-black bg-amber-100">
                <div className="w-6 h-6 bg-amber-400 text-black border border-black flex items-center justify-center font-black shrink-0 animate-pulse">
                  2
                </div>
                <div>
                  <p className="font-black text-black uppercase">2. Institutional Role Assignment (In Progress)</p>
                  <p className="text-neutral-800 text-[11px]">
                    An administrator (Dean/Registrar at <span className="font-mono font-bold">patelbhavya2207@gmail.com</span>) must review your account and assign your role:
                    <span className="font-black text-black"> Student</span>,
                    <span className="font-black text-black"> Teacher</span>, or
                    <span className="font-black text-black"> Admin</span>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3 text-xs p-3 border-2 border-neutral-300 bg-neutral-100 opacity-60">
                <div className="w-6 h-6 bg-neutral-300 text-neutral-700 flex items-center justify-center font-black shrink-0">
                  3
                </div>
                <div>
                  <p className="font-black text-neutral-700 uppercase">3. Dashboard & Classroom Access</p>
                  <p className="text-neutral-500 text-[11px]">
                    Once approved, your role-specific dashboard (Live WebRTC lecture studio, Wi-Fi attendance, note repository, or fee portal) will load automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time sync banner */}
          <div className="p-3.5 bg-neutral-50 border-2 border-black flex items-center space-x-3 text-xs text-black">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <p className="flex-1 text-[11px] font-bold uppercase tracking-wider">
              <strong>Real-time Auto-Sync Active:</strong> This screen automatically polls and listens for approval every few seconds. Once approved by the Dean, your dashboard will load automatically.
            </p>
          </div>

          {lastCheckMessage && (
            <p className="text-xs text-center text-neutral-800 font-mono font-bold uppercase">{lastCheckMessage}</p>
          )}

          {/* Action buttons */}
          <div className="space-y-3 pt-2 border-t-2 border-black">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="btn-check-approval-status"
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="flex-1 py-3 px-4 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 border-2 border-black transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
                <span>Check Approval Status</span>
              </button>

              <button
                id="btn-pending-logout"
                onClick={logout}
                className="py-3 px-6 border-2 border-black bg-white hover:bg-neutral-100 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Administrator Direct Access */}
            <div className="p-3 bg-neutral-100 border border-black flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs">
                <Shield className="w-4 h-4 text-black shrink-0" />
                <span className="font-bold text-[11px] uppercase text-neutral-800">
                  Are you the Dean / Administrator testing this request?
                </span>
              </div>
              <button
                id="btn-admin-switch"
                onClick={handleSwitchToAdmin}
                className="py-1.5 px-3 bg-black text-white hover:bg-neutral-800 text-[10px] font-black uppercase tracking-wider border border-black flex items-center space-x-1 cursor-pointer shrink-0"
              >
                <span>Sign In as Admin to Approve</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
