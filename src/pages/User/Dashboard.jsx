import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [loanSummary, setLoanSummary] = useState(null);
  const [savingsSummary, setSavingsSummary] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const [loanRes, savingsRes, attendanceRes] = await Promise.all([
          api.get("/users/loans/me").catch(() => ({
            data: {
              totalDisbursed: 0,
              totalOutstanding: 0,
              principalBalance: 0,
              interestBalance: 0,
            },
          })),
          api
            .get("/users/savings/me")
            .catch(() => ({ data: { totalSavings: 0 } })),
          api
            .get(`/users/attendance/me?month=${month}&year=${year}`)
            .catch(() => ({
              data: { present: 0, absent: 0, fineOwed: 0, fineBalance: 0 },
            })),
        ]);

        setLoanSummary(loanRes.data);
        setSavingsSummary(savingsRes.data);
        setAttendanceSummary(attendanceRes.data);
      } catch {
        console.error("Failed to load dashboard data");
        toast.error(
          "Error loading dashboard data. You might need to check your connection.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="spinner"></div>;
  }
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
        Overview
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Total Outstanding
          </div>
          <div
            className={`mt-2 text-3xl font-bold ${
              (loanSummary?.totalOutstanding || 0) > 0
                ? "text-rose-600"
                : "text-emerald-600"
            }`}
          >
            ${loanSummary?.totalOutstanding?.toFixed(2) || "0.00"}
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Principal: ${loanSummary?.principalBalance?.toFixed(2) || "0.00"} ·
            Interest: ${loanSummary?.interestBalance?.toFixed(2) || "0.00"}
          </p>
        </div>

        {/* Total Savings Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Total Savings
          </div>
          <div className="mt-2 text-3xl font-bold text-indigo-600">
            ${savingsSummary?.totalSavings?.toFixed(2) || "0.00"}
          </div>
          <p
            className={`mt-2 text-xs font-semibold flex items-center gap-1 ${
              savingsSummary?.currentWeekPaid
                ? "text-emerald-600"
                : "text-amber-600"
            }`}
          >
            {savingsSummary?.currentWeekPaid
              ? "✓ Paid for this week"
              : "⚠ Action required for this week"}
          </p>
        </div>

        {/* Attendance Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Attendance (This Month)
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {attendanceSummary?.present || 0}{" "}
            <span className="text-base font-normal text-slate-500 ml-1">
              present
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">
            {attendanceSummary?.absent || 0} absent
          </p>
        </div>

        {/* Fine Balance Card */}
        <div
          className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
            attendanceSummary?.fineBalance > 0
              ? "bg-rose-50 border-rose-200"
              : "bg-white border-slate-200"
          }`}
        >
          <div
            className={`text-xs font-semibold tracking-wider uppercase ${
              attendanceSummary?.fineBalance > 0
                ? "text-rose-800"
                : "text-slate-500"
            }`}
          >
            Fine Balance
          </div>
          <div
            className={`mt-2 text-3xl font-bold ${
              attendanceSummary?.fineBalance > 0
                ? "text-rose-600"
                : "text-slate-900"
            }`}
          >
            ${attendanceSummary?.fineBalance?.toFixed(2) || "0.00"}
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Total fines this month: ${attendanceSummary?.fineOwed || 0}
          </p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-3">
          Recent Activity
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Welcome back to the Microfinance Management System. Keep up the good
          work on your savings and loan repayments!
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
