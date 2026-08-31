import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header } from "./components/common/Header";
import { GoogleLoginModal } from "./components/auth/GoogleLoginModal";
import { PendingApprovalScreen } from "./components/auth/PendingApprovalScreen";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { TeacherDashboard } from "./components/teacher/TeacherDashboard";
import { StudentDashboard } from "./components/student/StudentDashboard";
import { Shield } from "lucide-react";

const MainContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <GoogleLoginModal />;
  }

  if (user.status === "pending" || user.role === "pending") {
    return <PendingApprovalScreen />;
  }

  if (
    user.status === "deactivated" ||
    user.status === "rejected"
  ) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 border-2 border-black text-center space-y-4">
          <div className="w-14 h-14 bg-black text-white flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-black uppercase">
            Access Restricted
          </h2>

          <p className="text-xs text-neutral-600 font-medium">
            Your institutional account has been {user.status}. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;

    case "teacher":
      return <TeacherDashboard />;

    case "student":
      return <StudentDashboard />;

    default:
      return (
        <div className="p-6 text-center text-sm font-black uppercase">
          Invalid user role configuration
        </div>
      );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F8F9FA] text-black flex flex-col font-sans antialiased">
        <Header />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <MainContent />
        </main>
      </div>
    </AuthProvider>
  );
}