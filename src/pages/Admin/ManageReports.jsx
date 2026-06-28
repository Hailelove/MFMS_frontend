import React from "react";
import { Link } from "react-router-dom";

const ManageReports = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">System Reports</h2>
      </div>

      {/* Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 hover:shadow-md transition">
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          Available Reports
        </h3>

        <p className="text-slate-500 mb-6 leading-relaxed">
          More comprehensive reporting features can be added here. Currently,
          you can use the Attendance tab to generate monthly CSV reports.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            to="/admin/attendance"
            className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm text-center transition transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
          >
            📊 Go to Attendance Reports (CSV)
          </Link>

          <Link
            to="/admin/loans"
            className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm text-center transition transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
          >
            💰 View Loan Ledgers
          </Link>

          <Link
            to="/admin/savings"
            className="w-full px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm text-center transition transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
          >
            🏦 View Savings Summaries
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ManageReports;
