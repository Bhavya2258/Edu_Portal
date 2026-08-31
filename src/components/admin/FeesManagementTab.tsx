import React, { useState, useEffect } from "react";
import { StudentFeeRecord, FeeItem } from "../../types";
import { api } from "../../services/api";
import {
  DollarSign,
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Plus,
  Edit,
  FileSpreadsheet,
  Building,
  UserCheck
} from "lucide-react";

export const FeesManagementTab: React.FC = () => {
  const [fees, setFees] = useState<StudentFeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingFee, setEditingFee] = useState<StudentFeeRecord | null>(null);
  const [editTotalAmount, setEditTotalAmount] = useState(4850);
  const [editDueDate, setEditDueDate] = useState("2026-09-30");

  const loadFees = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllFees();
      setFees(data);
    } catch (e) {
      console.error("Failed to load fee records", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const totalBilled = fees.reduce((acc, f) => acc + f.totalAmount, 0);
  const totalCollected = fees.reduce((acc, f) => acc + f.paidAmount, 0);
  const totalPending = fees.reduce((acc, f) => acc + f.dueAmount, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const filteredFees = fees.filter((f) => {
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    const matchesSearch =
      f.studentName.toLowerCase().includes(search.toLowerCase()) ||
      f.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      f.rollNumber.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenEdit = (f: StudentFeeRecord) => {
    setEditingFee(f);
    setEditTotalAmount(f.totalAmount);
    setEditDueDate(f.dueDate);
  };

  const handleSaveFee = async () => {
    if (!editingFee) return;
    try {
      await api.updateStudentFee(editingFee.studentId, {
        totalAmount: editTotalAmount,
        dueDate: editDueDate,
      });
      setEditingFee(null);
      loadFees();
    } catch (e) {
      alert("Failed to update fee record");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Roll Number", "Student Name", "Email", "Department", "Total Billed", "Paid Amount", "Outstanding Due", "Due Date", "Status"];
    const rows = filteredFees.map((f) => [
      f.rollNumber,
      f.studentName,
      f.studentEmail,
      f.department,
      `$${f.totalAmount}`,
      `$${f.paidAmount}`,
      `$${f.dueAmount}`,
      f.dueDate,
      f.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EduPortal_Fees_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Fees & Revenue Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure student fee structures, track collections, verify transactions, and generate audit reports.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Billed</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">${totalBilled.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {fees.length} enrolled students</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Total Collected</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">${totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">{collectionRate}% collection rate</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Outstanding Due</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">${totalPending.toLocaleString()}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Due by upcoming deadline</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Payment Gateway</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2">Stripe & Razorpay</p>
          <span className="inline-block mt-1 text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
            Integrated Sandbox Active
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, roll number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Department & Roll</th>
                <th className="px-4 py-3">Billed Amount</th>
                <th className="px-4 py-3">Paid / Due</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredFees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{f.studentName}</p>
                    <p className="text-[11px] text-slate-500">{f.studentEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900">{f.department}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Roll: {f.rollNumber}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    ${f.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-700 font-bold">${f.paidAmount.toLocaleString()}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className={`font-bold ${f.dueAmount > 0 ? "text-amber-700" : "text-slate-400"}`}>
                      ${f.dueAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.dueDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        f.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : f.status === "partial"
                          ? "bg-blue-100 text-blue-800"
                          : f.status === "overdue"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenEdit(f)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Adjust Fee</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Fee Modal */}
      {editingFee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Adjust Student Fee: {editingFee.studentName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Roll: {editingFee.rollNumber}</p>
              </div>
              <button
                onClick={() => setEditingFee(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Fee Amount ($)</label>
                <input
                  type="number"
                  value={editTotalAmount}
                  onChange={(e) => setEditTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Paid so far:</span>
                  <strong className="text-emerald-700">${editingFee.paidAmount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Calculated remaining due:</span>
                  <strong className="text-amber-700">${Math.max(0, editTotalAmount - editingFee.paidAmount)}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setEditingFee(null)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFee}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  Update Fee Structure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
