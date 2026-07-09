// export default MySavings;
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import moment from "moment";
import Pagination from "../../components/Pagination";
import {
  PiggyBank,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  ReceiptText,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

// Helper to format Saving Categories cleanly
const formatCategory = (category) => {
  const categories = {
    INITIAL_SAVING: "Initial Saving",
    MONTHLY_SAVING: "Monthly (መደበኛ)",
    IRREGULAR_SAVING: "Irregular (ኢ- መደበኛ)",
    CHILDREN_SAVING: "Children (የልጆች)",
    ORGANIZATION_SAVING: "Organization",
    WITHDRAWAL: "Withdrawal",
    ADJUSTMENT: "Adjustment",
  };
  return categories[category] || category;
};

const MySavings = () => {
  const [data, setData] = useState({
    totalSavings: 0,
    totalSharesAmount: 0,
    totalSharesQuantity: 0,
    savings: [],
    shares: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab and Pagination State
  const [activeTab, setActiveTab] = useState("savings"); // "savings" | "shares"
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Assuming your backend route returns both savings and shares now
        // e.g., { totalSavings: 5000, totalSharesAmount: 10000, savings: [...], shares: [...] }
        const response = await api.get("/savings/me");
        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch financial information",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
        {error}
      </div>
    );
  }

  // Determine which data array to paginate
  const currentDataArray =
    activeTab === "savings" ? data.savings || [] : data.shares || [];
  const paginatedData = currentDataArray.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Saving
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview of your savings and share contributions.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Total Savings Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <PiggyBank className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              Total Savings
            </div>
            <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {Number(data.totalSavings).toLocaleString("en-ET", {
                style: "currency",
                currency: "ETB",
              })}
            </div>
          </div>
        </div>

        {/* Total Shares Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              Total Shares ({data.totalSharesQuantity || 0})
            </div>
            <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {Number(data.totalSharesAmount).toLocaleString("en-ET", {
                style: "currency",
                currency: "ETB",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Data Section with Tabs */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden mt-6">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab("savings")}
            className={`flex-1 sm:flex-none px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "savings"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-white dark:bg-slate-950"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            Savings History
          </button>
          <button
            onClick={() => setActiveTab("shares")}
            className={`flex-1 sm:flex-none px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "shares"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400 bg-white dark:bg-slate-950"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            Shares History
          </button>
        </div>

        {/* Dynamic Table Content */}
        {currentDataArray.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4">Date & Ref</th>
                    <th className="px-6 py-4">Type / Category</th>
                    <th className="px-6 py-4">Method</th>
                    {activeTab === "shares" && (
                      <th className="px-6 py-4">Quantity</th>
                    )}
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* Date & Ref */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {moment(
                            item.transactionDate || item.contributionDate,
                          ).format("MMM DD, YYYY")}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <ReceiptText className="w-3 h-3" />
                          {item.referenceNo || "No Ref"}
                        </div>
                      </td>

                      {/* Type / Category */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {/* Type Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              (item.type || item.transactionType) ===
                                "DEPOSIT" ||
                              (item.type || item.transactionType) === "BUY"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            }`}
                          >
                            {(item.type || item.transactionType) ===
                              "DEPOSIT" ||
                            (item.type || item.transactionType) === "BUY" ? (
                              <ArrowDownCircle className="w-3 h-3" />
                            ) : (
                              <ArrowUpCircle className="w-3 h-3" />
                            )}
                            {item.type || item.transactionType}
                          </span>

                          {/* Saving Category (Only shows on Savings Tab) */}
                          {item.category && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatCategory(item.category)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.paymentMethod}
                      </td>

                      {/* Shares Quantity (Only shows on Shares Tab) */}
                      {activeTab === "shares" && (
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {item.quantity} @{" "}
                          {Number(item.unitPrice).toLocaleString()}
                        </td>
                      )}

                      {/* Amount */}
                      <td className="px-6 py-4 text-right font-medium">
                        <div
                          className={`text-sm ${
                            (item.type || item.transactionType) === "DEPOSIT" ||
                            (item.type || item.transactionType) === "BUY"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {Number(
                            item.amount || item.totalAmount,
                          ).toLocaleString("en-ET", {
                            style: "currency",
                            currency: "ETB",
                          })}
                        </div>
                        {item.cumulativeBalance && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Bal:{" "}
                            {Number(item.cumulativeBalance).toLocaleString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
              <Pagination
                currentPage={currentPage}
                totalItems={currentDataArray.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              {activeTab === "savings" ? (
                <PiggyBank className="w-8 h-8 text-slate-400" />
              ) : (
                <TrendingUp className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <p className="text-base font-medium text-slate-900 dark:text-white">
              No {activeTab} history found.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your {activeTab} transactions will appear here once they are
              recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySavings;
