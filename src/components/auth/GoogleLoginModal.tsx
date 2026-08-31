import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  Mail,
  User as UserIcon
} from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: any) => void;
          };
        };
      };
    };
  }
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const GoogleLoginModal: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuth();
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [requestedRole, setRequestedRole] = useState<"student" | "teacher" | "admin">("student");
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [isPopupOpening, setIsPopupOpening] = useState(false);

  const clientId = ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || "";
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services (GSI) if Client ID is configured
  useEffect(() => {
    if (!clientId || !window.google?.accounts?.id || !googleBtnRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (response.credential) {
            const decoded = parseJwt(response.credential);
            if (decoded && decoded.email) {
              await loginWithGoogle({
                email: decoded.email,
                name: decoded.name || decoded.email.split("@")[0],
                avatar: decoded.picture,
                requestedRole: "student"
              });
            }
          }
        },
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    } catch (err: any) {
      console.warn("GSI initialization info:", err);
    }
  }, [clientId, loginWithGoogle]);

  // Trigger Google OAuth 2.0 Token Popup
  const handleGoogleOAuthPopup = () => {
    setAuthError(null);
    if (!clientId) {
      setAuthError("No Google Client ID detected. Please enter your Google email below to authenticate.");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setAuthError("Google Identity Services script is still loading. Please retry or enter your Google email below.");
      return;
    }

    setIsPopupOpening(true);
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid profile email",
        callback: async (tokenResponse: any) => {
          setIsPopupOpening(false);
          if (tokenResponse.error) {
            console.error("Google OAuth token response error:", tokenResponse);
            setAuthError(
              tokenResponse.error_description ||
              `Google Auth (${tokenResponse.error}): If 401 occurs, ensure ${currentOrigin} is in Google Cloud Console Authorized Origins.`
            );
            return;
          }

          if (tokenResponse.access_token) {
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await res.json();
              if (profile && profile.email) {
                await loginWithGoogle({
                  email: profile.email,
                  name: profile.name || profile.email.split("@")[0],
                  avatar: profile.picture,
                  requestedRole: "student"
                });
              } else {
                throw new Error("Unable to retrieve email from Google profile");
              }
            } catch (err: any) {
              setAuthError(`Profile retrieval failed: ${err.message}. You can enter your email directly below.`);
            }
          }
        },
        error_callback: (err: any) => {
          setIsPopupOpening(false);
          console.warn("Google token client error:", err);
          setAuthError(
            `Google OAuth 401/Origin Error: Add "${currentOrigin}" to Authorized JavaScript Origins in your Google Cloud Console.`
          );
        }
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (e: any) {
      setIsPopupOpening(false);
      setAuthError(`OAuth initialization error: ${e.message}. Use Google email sign-in below.`);
    }
  };

  const handleDirectGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) return;
    setAuthError(null);
    try {
      await loginWithGoogle({
        email: googleEmail.trim(),
        name: googleName.trim() || googleEmail.split("@")[0],
        requestedRole
      });
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate with Google account");
    }
  };

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 border-b-2 border-black">
      <div className="max-w-xl w-full mx-auto space-y-8">
        {/* Header Block */}
        <div className="border-b-2 border-black pb-6 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
              IDENTITY ACCESS MANAGEMENT
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              GOOGLE OAUTH 2.0
            </span>
          </div>
          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter uppercase leading-[0.85] text-black font-sans">
            INSTITUTE <br />
            SIGN-IN
          </h1>
          <p className="text-xs font-medium text-neutral-600 uppercase tracking-wider pt-2">
            Secure Google authentication for students, faculty, and administrative personnel.
          </p>
        </div>

        {/* Primary Auth Container */}
        <div className="bg-white border-2 border-black p-6 sm:p-8 space-y-6 shadow-none">
          <div>
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1">
              AUTHENTICATION GATEWAY
            </span>
            <h3 className="text-xl font-black text-black uppercase tracking-tight">
              Authenticate with Google
            </h3>
            <p className="text-xs text-neutral-600 mt-1">
              Sign in with your Google Workspace or personal Google account.
            </p>
          </div>

          {/* Error / 401 Origin Advisory Banner */}
          {authError && (
            <div className="p-4 border-2 border-black bg-amber-50 text-black space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-black uppercase text-amber-900">OAuth Notice</p>
                  <p className="text-neutral-700 mt-0.5">{authError}</p>
                </div>
              </div>

              {authError.includes("Authorized Origins") || authError.includes("401") ? (
                <div className="pt-2 border-t border-amber-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-600 mb-1">
                    Your Authorized JavaScript Origin URL:
                  </p>
                  <div className="flex items-center space-x-2 bg-white border border-black p-1.5 font-mono text-[11px]">
                    <span className="flex-1 truncate">{currentOrigin}</span>
                    <button
                      onClick={handleCopyOrigin}
                      className="px-2 py-1 bg-black text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedOrigin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOrigin ? "COPIED" : "COPY"}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Primary Action 1: Google OAuth Popup Button */}
          <div className="space-y-3">
            <button
              id="btn-google-oauth-popup"
              onClick={handleGoogleOAuthPopup}
              disabled={isLoading || isPopupOpening}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-black text-white border-2 border-black hover:bg-neutral-800 text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
            >
              {/* Google 'G' Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isPopupOpening ? "CONNECTING TO GOOGLE..." : "SIGN IN WITH GOOGLE POPUP"}</span>
            </button>

            {/* Rendered Google Identity Services Button if ready */}
            <div ref={googleBtnRef} className="flex justify-center empty:hidden pt-1"></div>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="grow border-t-2 border-black"></div>
            <span className="shrink mx-4 text-[10px] font-black text-black uppercase tracking-widest bg-white px-2">
              OR ENTER GOOGLE ACCOUNT
            </span>
            <div className="grow border-t-2 border-black"></div>
          </div>

          {/* Direct Google Account Login Form */}
          <form onSubmit={handleDirectGoogleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-wider mb-1">
                Google Account Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com or campus@eduportal.edu"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-bold border-2 border-black bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-wider mb-1">
                Display / Legal Name (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-bold border-2 border-black bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-wider mb-1">
                Requested Campus Role
              </label>
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs font-bold border-2 border-black bg-white uppercase cursor-pointer"
              >
                <option value="student">Student (Awaiting Approval)</option>
                <option value="teacher">Faculty / Instructor</option>
                <option value="admin">Administrator / Dean</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || !googleEmail}
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 text-black text-xs font-black uppercase tracking-widest border-2 border-black transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>Authenticate Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Institutional Note */}
          <div className="pt-4 border-t-2 border-black">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider text-center">
              Role assignments for Student and Faculty accounts are verified in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
