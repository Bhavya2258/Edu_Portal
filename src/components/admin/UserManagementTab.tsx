import React, { useState, useEffect, useCallback } from "react";
import { User, UserRole, UserStatus } from "../../types";
import { api } from "../../services/api";
import { useSocketEvent } from "../../services/socket";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  Shield,
  BookOpen,
  GraduationCap,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  Sparkles,
  Zap,
  Check
} from "lucide-react";

export const UserManagementTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form state for role assignment modal
  const [assignedRole, setAssignedRole] = useState<UserRole>("student");
  const [assignedDept, setAssignedDept] = useState("Computer Science & Engineering");
  const [assignedRoll, setAssignedRoll] = useState("");
  const [assignedEmpId, setAssignedEmpId] = useState("");

  const loadUsers = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const data = await api.getUsers({
        role: roleFilter,
        status: statusFilter,
        search,
      });
      setUsers(data);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Real-time live synchronization
  useSocketEvent("USER_REGISTERED", (data: any) => {
    loadUsers(true);
    setSuccessBanner(`⚡ New Google Account Registration: ${data.user?.name || data.user?.email} is waiting for approval!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  });

  useSocketEvent("PENDING_USERS_UPDATED", () => {
    loadUsers(true);
  });

  useSocketEvent("USER_APPROVED", () => {
    loadUsers(true);
  });

  useSocketEvent("USER_UPDATED", () => {
    loadUsers(true);
  });

  // Background polling every 4 seconds to guarantee sync
  useEffect(() => {
    const timer = setInterval(() => {
      loadUsers(true);
    }, 4000);
    return () => clearInterval(timer);
  }, [loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleQuickApprove = async (u: User, role: UserRole) => {
    setProcessingId(u.id);
    try {
      const rollNumber = role === "student" ? `CS2026-${Math.floor(100 + Math.random() * 900)}` : undefined;
      const employeeId = role === "teacher" ? `FAC-2026-${Math.floor(100 + Math.random() * 900)}` : undefined;
      const dept = u.department || "Computer Science & Engineering";

      await api.approveUser(u.id, {
        role,
        department: dept,
        rollNumber,
        employeeId,
      });

      setSuccessBanner(`✓ Approved ${u.name} as ${role.toUpperCase()} successfully!`);
      setTimeout(() => setSuccessBanner(null), 4000);
      await loadUsers(true);
    } catch (e) {
      alert("Failed to approve user");
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenApproveModal = (u: User) => {
    setSelectedUser(u);
    setAssignedRole(u.role === "pending" ? "student" : u.role);
    setAssignedDept(u.department || "Computer Science & Engineering");
    setAssignedRoll(u.rollNumber || `CS2026-${Math.floor(100 + Math.random() * 900)}`);
    setAssignedEmpId(u.employeeId || `FAC-${Math.floor(100 + Math.random() * 900)}`);
    setShowRoleModal(true);
  };

  const handleSaveApproval = async () => {
    if (!selectedUser) return;
    try {
      await api.approveUser(selectedUser.id, {
        role: assignedRole,
        department: assignedDept,
        rollNumber: assignedRole === "student" ? assignedRoll : undefined,
        employeeId: assignedRole === "teacher" ? assignedEmpId : undefined,
      });
      setShowRoleModal(false);
      setSelectedUser(null);
      setSuccessBanner(`✓ Approved ${selectedUser.name} as ${assignedRole.toUpperCase()}`);
      setTimeout(() => setSuccessBanner(null), 4000);
      loadUsers(true);
    } catch (e) {
      alert("Failed to update user approval");
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("Are you sure you want to reject this Google account access?")) {
      await api.rejectUser(id);
      loadUsers(true);
    }
  };

  const handleToggleDeactivate = async (u: User) => {
    const nextStatus: UserStatus = u.status === "deactivated" ? "approved" : "deactivated";
    await api.updateUserRole(u.id, { status: nextStatus });
    loadUsers(true);
  };

  const pendingUsers = users.filter((u) => u.status === "pending");

  return (
    <div className="space-y-8">
      {/* Dynamic Success / Notification Banner */}
      {successBanner && (
        <div className="bg-black text-white p-3.5 border-2 border-black flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-mono text-neutral-400 hover:text-white"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Header and pending callout */}
      <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              ACCESS CONTROL & GOOGLE SIGN-INS
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-mono text-emerald-700 uppercase font-black">LIVE SYNC ACTIVE</span>
          </div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tight">
            User Management & RBAC
          </h2>
          <p className="text-xs text-neutral-600 font-medium mt-0.5">
            Approve Google sign-ups, assign Student/Teacher/Admin roles, and manage institutional access permissions.
          </p>
        </div>
        <button
          onClick={() => loadUsers()}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border-2 border-black text-xs font-black uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Pending Approval Priority Queue */}
      {pendingUsers.length > 0 ? (
        <div className="bg-amber-100 border-2 border-black p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600"></span>
              </span>
              <h3 className="text-sm font-black text-black uppercase tracking-tight">
                Pending Google Account Approvals ({pendingUsers.length})
              </h3>
            </div>
            <span className="text-[10px] font-black text-black uppercase tracking-widest bg-amber-400 px-2 py-0.5 border border-black animate-pulse">
              ACTION REQUIRED NOW
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map((pu) => {
              const isProcessing = processingId === pu.id;
              return (
                <div
                  key={pu.id}
                  className="p-4 bg-white border-2 border-black flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={pu.avatar}
                      alt={pu.name}
                      className="w-11 h-11 object-cover border-2 border-black shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-black truncate uppercase">{pu.name}</p>
                        <span className="text-[9px] bg-amber-300 text-black border border-black font-black uppercase px-1">
                          NEW
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-700 truncate font-mono">{pu.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] bg-black text-white font-black uppercase px-1.5 py-0.5 tracking-wider">
                          Google OAuth 2.0
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono">
                          {pu.joinedAt ? new Date(pu.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Fast Approval Actions */}
                  <div className="space-y-2 pt-3 border-t-2 border-black">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Quick Grant Role:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        id={`quick-approve-student-${pu.id}`}
                        onClick={() => handleQuickApprove(pu, "student")}
                        disabled={isProcessing}
                        className="py-2 px-2 bg-black hover:bg-neutral-800 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center space-x-1 border border-black transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <GraduationCap className="w-3 h-3" />
                        <span>Student</span>
                      </button>
                      <button
                        id={`quick-approve-teacher-${pu.id}`}
                        onClick={() => handleQuickApprove(pu, "teacher")}
                        disabled={isProcessing}
                        className="py-2 px-2 bg-neutral-800 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center space-x-1 border border-black transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Faculty</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5 pt-1">
                      <button
                        id={`btn-approve-custom-${pu.id}`}
                        onClick={() => handleOpenApproveModal(pu)}
                        disabled={isProcessing}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-neutral-100 text-black text-[10px] font-black uppercase tracking-wider flex items-center justify-center space-x-1 border border-black transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Custom Details</span>
                      </button>
                      <button
                        onClick={() => handleReject(pu.id)}
                        disabled={isProcessing}
                        className="py-1.5 px-2.5 bg-white hover:bg-rose-600 hover:text-white text-black border border-black text-[10px] font-black transition-colors cursor-pointer"
                        title="Reject access"
                      >
                        <UserX className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border-2 border-black flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span className="font-black text-emerald-900 uppercase">
              No Pending Registrations — All Google accounts have been approved and assigned.
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase">Queue Clear</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border-2 border-black space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-black absolute left-3 top-3" />
          <input
            type="text"
            placeholder="SEARCH BY NAME, EMAIL, ROLL NUMBER..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs font-bold uppercase rounded-none border-2 border-black focus:outline-hidden focus:bg-neutral-50"
          />
        </form>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-black">
            <Filter className="w-3.5 h-3.5" />
            <span>ROLE:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-2 px-3 text-xs font-bold uppercase border-2 border-black bg-white cursor-pointer"
            >
              <option value="all">ALL ROLES</option>
              <option value="student">STUDENT</option>
              <option value="teacher">TEACHER</option>
              <option value="admin">ADMIN</option>
              <option value="pending">PENDING</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-black">
            <span>STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs font-bold uppercase border-2 border-black bg-white cursor-pointer"
            >
              <option value="all">ALL STATUS</option>
              <option value="approved">APPROVED</option>
              <option value="pending">PENDING</option>
              <option value="deactivated">DEACTIVATED</option>
              <option value="rejected">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border-2 border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-black text-left text-xs">
            <thead className="bg-black text-white font-black uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">USER</th>
                <th className="px-4 py-3.5">ROLE</th>
                <th className="px-4 py-3.5">DEPARTMENT & ID</th>
                <th className="px-4 py-3.5">STATUS</th>
                <th className="px-4 py-3.5">JOINED</th>
                <th className="px-4 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t-2 divide-neutral-200 font-bold text-black">
              {users.map((u) => {
                const isStudent = u.role === "student";
                const isTeacher = u.role === "teacher";
                const isAdmin = u.role === "admin";

                return (
                  <tr key={u.id} className="hover:bg-neutral-100/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 object-cover border border-black shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-black text-black uppercase truncate">{u.name}</p>
                          <p className="text-[11px] text-neutral-500 font-medium truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border ${
                          isAdmin
                            ? "bg-black text-white border-black"
                            : isTeacher
                            ? "bg-neutral-800 text-white border-black"
                            : isStudent
                            ? "bg-white text-black border-black"
                            : "bg-amber-100 text-amber-900 border-amber-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-black uppercase truncate max-w-[200px]">{u.department || "General"}</p>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        {u.rollNumber ? `ROLL: ${u.rollNumber}` : u.employeeId ? `EMP ID: ${u.employeeId}` : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          u.status === "approved"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-400"
                            : u.status === "pending"
                            ? "bg-amber-100 text-amber-900 border border-amber-400"
                            : u.status === "deactivated"
                            ? "bg-neutral-200 text-neutral-800 border border-black"
                            : "bg-rose-100 text-rose-900 border border-rose-400"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600 font-mono text-[11px]">
                      {new Date(u.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenApproveModal(u)}
                          className="p-1.5 text-black hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
                          title="Edit Role & Permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleDeactivate(u)}
                          className={`p-1.5 transition-colors border border-transparent hover:border-black ${
                            u.status === "deactivated"
                              ? "text-emerald-700 hover:bg-emerald-600 hover:text-white"
                              : "text-neutral-500 hover:bg-rose-600 hover:text-white"
                          }`}
                          title={u.status === "deactivated" ? "Reactivate Account" : "Deactivate Account"}
                        >
                          {u.status === "deactivated" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border-2 border-black animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-10 h-10 object-cover border border-black"
                />
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-tight">
                    Assign Institutional Role
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-black font-black p-1 hover:bg-black hover:text-white border border-transparent"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-black uppercase tracking-wider mb-1.5">Select Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["student", "teacher", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAssignedRole(r)}
                      className={`py-2.5 px-3 border-2 font-black uppercase text-[11px] tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        assignedRole === r
                          ? "bg-black text-white border-black"
                          : "border-black bg-white text-black hover:bg-neutral-100"
                      }`}
                    >
                      {r === "admin" && <Shield className="w-4 h-4" />}
                      {r === "teacher" && <BookOpen className="w-4 h-4" />}
                      {r === "student" && <GraduationCap className="w-4 h-4" />}
                      <span>{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-black text-black uppercase tracking-wider mb-1">Department</label>
                <select
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-black bg-white font-bold uppercase text-xs focus:ring-0"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Data Science & AI">Data Science & AI</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Administration">Executive Administration</option>
                </select>
              </div>

              {assignedRole === "student" && (
                <div>
                  <label className="block font-black text-black uppercase tracking-wider mb-1">Student Roll Number</label>
                  <input
                    type="text"
                    value={assignedRoll}
                    onChange={(e) => setAssignedRoll(e.target.value)}
                    placeholder="e.g. CS2026-042"
                    className="w-full px-3 py-2.5 border-2 border-black font-mono font-bold text-xs uppercase"
                  />
                </div>
              )}

              {assignedRole === "teacher" && (
                <div>
                  <label className="block font-black text-black uppercase tracking-wider mb-1">Faculty Employee ID</label>
                  <input
                    type="text"
                    value={assignedEmpId}
                    onChange={(e) => setAssignedEmpId(e.target.value)}
                    placeholder="e.g. FAC-CS-204"
                    className="w-full px-3 py-2.5 border-2 border-black font-mono font-bold text-xs uppercase"
                  />
                </div>
              )}

              <div className="pt-4 border-t-2 border-black flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2.5 border-2 border-black text-black hover:bg-neutral-100 font-black uppercase text-xs tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-role-approval"
                  onClick={handleSaveApproval}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs tracking-wider border-2 border-black cursor-pointer"
                >
                  Confirm & Approve Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
