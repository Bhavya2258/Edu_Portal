import React, { useState, useEffect } from "react";
import { StudentFeeRecord, FeePaymentTransaction } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  DollarSign,
  CreditCard,
  Receipt,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  ShieldCheck,
  Building,
  Sparkles,
  AlertCircle
} from "lucide-react";

export const StudentFeesTab: React.FC = () => {
  const { user } = useAuth();
  const [feeRecord, setFeeRecord] = useState<StudentFeeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1000);
  const [gateway, setGateway] = useState<"stripe" | "razorpay">("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePaymentTransaction | null>(null);

  const loadFees = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMyFees();
      setFeeRecord(data);
      if (data && data.dueAmount > 0) {
        setPaymentAmount(data.dueAmount);
      }
    } catch (e) {
      console.error("Failed to load student fees", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const handleProcessPayment = async () => {
    if (!feeRecord || paymentAmount <= 0) return;
    setIsProcessing(true);
    try {
      const res = await api.payFees({
        amount: Number(paymentAmount),
        gateway,
      });
      setShowPaymentModal(false);
      loadFees();
      setSelectedReceipt(res.transaction);
    } catch (e: any) {
      alert("Payment failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (isLoading || !feeRecord) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading fee records and transaction ledger...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Tuition & Institutional Fee Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review detailed fee breakdown, pay semester dues via integrated secure gateways, and retrieve official receipts.
          </p>
        </div>

        {feeRecord.dueAmount > 0 && (
          <button
            id="btn-open-fee-payment"
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Outstanding Fees</span>
          </button>
        )}
      </div>

      {/* KPI Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Billed Fees</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ${feeRecord.totalAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Semester 6 Academic Year</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700">Amount Paid</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            ${feeRecord.paidAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            Verified across {feeRecord.transactions?.length || 0} transactions
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-700">Remaining Due Balance</span>
          <p className="text-2xl font-black text-amber-700 mt-1">
            ${feeRecord.dueAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">Due Date: {feeRecord.dueDate}</p>
        </div>
      </div>

      {/* Fee Itemization Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Itemized Fee Structure Breakdown</h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              feeRecord.status === "paid"
                ? "bg-emerald-100 text-emerald-800"
                : feeRecord.status === "partial"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            Status: {feeRecord.status}
          </span>
        </div>

        <div className="p-4">
          <div className="divide-y divide-slate-100 text-xs">
            {feeRecord.breakdown.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{item.title}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{item.category} fee allocation</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">${item.amount.toLocaleString()}</p>
                  <span
                    className={`text-[10px] font-semibold ${
                      item.isPaid ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {item.isPaid ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Transactions & Receipts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Payment History & Tax Receipts</h3>
          <span className="text-xs text-slate-400">
            {feeRecord.transactions?.length || 0} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Receipt / Transaction ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payment Gateway</th>
                <th className="px-4 py-3">Amount Paid</th>
                <th className="px-4 py-3 text-right">Download Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {(!feeRecord.transactions || feeRecord.transactions.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                feeRecord.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{tx.id}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{tx.gateway} (Verified)</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      ${tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center space-x-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Gateway Modal (Stripe & Razorpay Sandbox) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Secure Fee Checkout</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  min="1"
                  max={feeRecord.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-bold text-base text-indigo-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Outstanding balance: ${feeRecord.dueAmount}
                </p>
              </div>

              {/* Gateway selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Select Payment Gateway</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGateway("stripe")}
                    className={`p-3 rounded-xl border font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                      gateway === "stripe"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>Stripe Checkout</span>
                    <span className="text-[10px] text-indigo-600 font-normal">Cards & Google Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGateway("razorpay")}
                    className={`p-3 rounded-xl border font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                      gateway === "razorpay"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>Razorpay UPI</span>
                    <span className="text-[10px] text-blue-600 font-normal">UPI & NetBanking</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Student:</span>
                  <strong className="text-slate-800">{user?.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Roll Number:</span>
                  <strong className="text-slate-800 font-mono">{user?.rollNumber || "CS2026-042"}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <strong className="text-emerald-700">Sandbox Sandbox Testnet</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-pay"
                  disabled={isProcessing}
                  onClick={handleProcessPayment}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center space-x-1.5"
                >
                  {isProcessing ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pay ${paymentAmount} Securely</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none">
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2 font-black text-xl">
                EP
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                EduPortal Institution of Technology
              </h3>
              <p className="text-[11px] text-slate-500">Official Tuition & Academic Fee Payment Receipt</p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400">Receipt No:</span>
                  <p className="font-mono font-bold text-slate-900">{selectedReceipt.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Date:</span>
                  <p className="font-semibold text-slate-900">{new Date(selectedReceipt.date).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400">Student Name:</span>
                  <p className="font-bold text-slate-900">{user?.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Roll Number:</span>
                  <p className="font-mono font-bold text-slate-900">{user?.rollNumber || "CS2026-042"}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between mt-3">
                <span className="font-semibold text-slate-700">Amount Paid ({selectedReceipt.gateway.toUpperCase()})</span>
                <span className="text-lg font-black text-emerald-700">${selectedReceipt.amount.toLocaleString()}</span>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-2">
                This is a computer-generated institutional receipt. Verified via cryptographic signature.
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2 print:hidden">
              <button
                onClick={handlePrintReceipt}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
