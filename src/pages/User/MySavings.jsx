import React, { useEffect, useState } from "react";
import api from "../../services/api";
import moment from "moment";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 10;

const MySavings = () => {
  const [savingsData, setSavingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const response = await api.get("/users/savings/me");
        setSavingsData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch savings information",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSavings();
  }, []);

  if (loading) return <div className="spinner"></div>;
  if (error)
    return (
      <div className="card" style={{ color: "var(--danger)" }}>
        {error}
      </div>
    );
  if (!savingsData)
    return <div className="card">No savings data available.</div>;

  const payments = savingsData.payments || [];
  const paginatedPayments = payments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          My Savings
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Savings Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Total Savings
          </div>
          <div className="mt-2 text-3xl font-bold text-indigo-600">
            $ {savingsData.totalSavings?.toFixed(2) || "0.00"}
          </div>
        </div>

        {/* Current Week Status Card */}
        <div
          className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
            savingsData.currentWeekPaid
              ? "bg-emerald-50 border-emerald-200"
              : "bg-rose-50 border-rose-200"
          }`}
        >
          <div
            className={`text-xs font-semibold tracking-wider uppercase ${
              savingsData.currentWeekPaid ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            Current Week Status
          </div>
          <div
            className={`mt-2 text-3xl font-bold ${
              savingsData.currentWeekPaid ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {savingsData.currentWeekPaid ? "Paid" : "Unpaid"}
          </div>
        </div>
      </div>

      {/* Savings History Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-800">
            Savings History
          </h3>
        </div>

        {payments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Week Starting</th>
                    <th className="px-6 py-3">Paid On</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.map((payment, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {moment(payment.weekStartDate).format("MMMM Do YYYY")}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {moment(payment.paidOn).format("MMMM Do YYYY")}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                        ${payment.amount}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {payment.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/30">
              <Pagination
                currentPage={currentPage}
                totalItems={payments.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <p className="px-6 py-6 text-sm text-slate-500">
            No savings payment history found.
          </p>
        )}
      </div>
    </div>
  );
};

export default MySavings;
