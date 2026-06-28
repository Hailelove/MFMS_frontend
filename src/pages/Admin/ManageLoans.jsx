import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import moment from "moment";
import { useForm } from "react-hook-form";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 12;

const ManageLoans = () => {
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userLedger, setUserLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Interest calculator state
  const [interestCalc, setInterestCalc] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcToDate, setCalcToDate] = useState(moment().format("YYYY-MM-DD"));
  const [showCalcPanel, setShowCalcPanel] = useState(false);
  const [recordingPeriod, setRecordingPeriod] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();
  const [txSubmitting, setTxSubmitting] = useState(false);

  const watchType = watch("type");

  // Pagination state
  const [overviewPage, setOverviewPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch {
      // Non-critical
    }
  }, []);

  const fetchLoansOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/loans");
      setLoans(response.data);
    } catch (error) {
      toast.error(
        "Failed to load loans overview: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoansOverview();
    fetchUsers();
  }, [fetchLoansOverview, fetchUsers]);

  const fetchUserLedger = async (userId) => {
    setLedgerLoading(true);
    setSelectedUserId(userId);
    setUserLedger(null);
    setLedgerPage(1);
    setInterestCalc(null);
    setShowCalcPanel(false);

    try {
      const response = await api.get(`/admin/loans/${userId}`);
      setUserLedger(response.data);
    } catch (error) {
      toast.error(
        "Failed to fetch user ledger: " +
          (error.response?.data?.message || error.message),
      );
      setSelectedUserId(null);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleCalculateInterest = async () => {
    setCalcLoading(true);
    try {
      const response = await api.get(
        `/admin/loans/${selectedUserId}/interest/calculate`,
        {
          params: { toDate: calcToDate },
        },
      );
      setInterestCalc(response.data);
      setShowCalcPanel(true);
    } catch (error) {
      toast.error(
        "Failed to calculate interest: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setCalcLoading(false);
    }
  };

  const handleRecordInterestPeriod = async (period) => {
    const periodKey = period.periodStart.toString();
    setRecordingPeriod(periodKey);

    try {
      await api.post(`/admin/loans/${selectedUserId}/interest`, {
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        principalBalance: period.principalBalance,
        interestRate: period.interestRate,
        interestAmount: period.interestAmount,
        date: period.isPartial
          ? calcToDate
          : moment(period.periodEnd).format("YYYY-MM-DD"),
        note: `Interest: 1% of $${period.principalBalance.toFixed(2)} for ${moment(period.periodStart).format("MMM D")} – ${moment(period.periodEnd).format("MMM D, YYYY")}${period.isPartial ? " (partial)" : ""}`,
      });
      toast.success("Interest period recorded successfully");

      // Refresh ledger and recalculate
      await fetchUserLedger(selectedUserId);
      await handleCalculateInterest();
    } catch (error) {
      // 409 = already recorded (idempotency guard fired) — refresh so UI reflects reality
      if (error.response?.status === 409) {
        toast.info("This period was already recorded — refreshing.");
        await fetchUserLedger(selectedUserId);
        await handleCalculateInterest();
      } else {
        toast.error(
          error.response?.data?.message || "Failed to record interest period",
        );
      }
    } finally {
      setRecordingPeriod(null);
    }
  };

  const [applyingUnrecorded, setApplyingUnrecorded] = useState(false);

  // Delete-transaction state
  const [deleteModal, setDeleteModal] = useState(null); // { tx } | null
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleApplyUnrecordedInterest = async () => {
    if (
      !interestCalc ||
      interestCalc.totalUnrecorded <= 0 ||
      applyingUnrecorded
    )
      return;

    setApplyingUnrecorded(true);

    try {
      const response = await api.post(
        `/admin/loans/${selectedUserId}/interest/apply-unrecorded`,
        { toDate: calcToDate },
      );

      if (response.data && response.data.updatedInterestBalance !== undefined) {
        setUserLedger((prev) =>
          prev
            ? {
                ...prev,
                summary: {
                  ...prev.summary,
                  interestBalance: response.data.updatedInterestBalance,
                  totalInterestAccrued:
                    response.data.updatedInterestAccrued ??
                    prev.summary.totalInterestAccrued,
                  totalInterestRepaid:
                    response.data.updatedInterestRepaid ??
                    prev.summary.totalInterestRepaid,
                  totalOutstanding:
                    response.data.updatedTotalOutstanding ??
                    prev.summary.totalOutstanding,
                },
              }
            : null,
        );
      }

      const periodsApplied = response.data?.periodsApplied ?? 0;
      if (periodsApplied === 0) {
        toast.info("No new unrecorded interest periods to apply.");
      } else {
        toast.success(
          `Applied ${periodsApplied} interest period${periodsApplied !== 1 ? "s" : ""} successfully`,
        );
      }

      await fetchUserLedger(selectedUserId);
      await handleCalculateInterest();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to apply unrecorded interest",
      );
    } finally {
      setApplyingUnrecorded(false);
    }
  };

  const openDeleteModal = (tx) => {
    setDeleteModal({ tx });
    setDeleteReason("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(null);
    setDeleteReason("");
  };

  const handleDeleteTransaction = async () => {
    if (!deleteModal || deleting) return;

    const { tx } = deleteModal;
    setDeleting(true);
    try {
      const res = await api.delete(
        `/admin/loans/${selectedUserId}/transaction/${tx._id}`,
        { data: { reason: deleteReason.trim() } },
      );

      toast.success("Transaction deleted successfully");
      setDeleteModal(null);
      setDeleteReason("");

      if (res.data?.summaryAfter) {
        setUserLedger((prev) =>
          prev ? { ...prev, summary: res.data.summaryAfter } : null,
        );
      }

      setUserLedger((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          transactions: prev.transactions.filter((t) => t._id !== tx._id),
        };
      });

      fetchLoansOverview();
      if (showCalcPanel) handleCalculateInterest();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete transaction",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleTxSubmit = async (data) => {
    setTxSubmitting(true);
    try {
      const payload = {
        type: data.type,
        amount: parseFloat(data.amount),
        date: data.date,
        note: data.note || "",
      };

      if (data.type === "repayment") {
        payload.paymentTarget = data.paymentTarget;
      }

      await api.post(`/admin/loans/${selectedUserId}/transaction`, payload);
      toast.success("Transaction recorded successfully");
      reset();
      fetchUserLedger(selectedUserId);
      fetchLoansOverview();

      if (showCalcPanel) {
        handleCalculateInterest();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add transaction");
    } finally {
      setTxSubmitting(false);
    }
  };

  const goBack = () => {
    setSelectedUserId(null);
    setUserLedger(null);
    setInterestCalc(null);
    setShowCalcPanel(false);
    setOverviewPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allMembers = users.map((u) => {
    const loanRow = loans.find((l) => String(l.userId) === String(u._id));
    return (
      loanRow || {
        userId: u._id,
        name: u.name,
        email: u.email,
        totalDisbursed: 0,
        totalPrincipalRepaid: 0,
        totalInterestAccrued: 0,
        totalFines: 0,
        totalInterestRepaid: 0,
        principalBalance: 0,
        interestBalance: 0,
        totalOutstanding: 0,
      }
    );
  });

  const paginatedMembers = allMembers.slice(
    (overviewPage - 1) * ITEMS_PER_PAGE,
    overviewPage * ITEMS_PER_PAGE,
  );

  const transactions = userLedger?.transactions || [];
  const paginatedTx = transactions.slice(
    (ledgerPage - 1) * ITEMS_PER_PAGE,
    ledgerPage * ITEMS_PER_PAGE,
  );
  const summary = userLedger?.summary;

  const txTypeBadge = (tx) => {
    const styles = {
      loan: { bg: "bg-red-50 text-red-700 border-red-200", label: "Loan" },
      repayment: {
        bg:
          tx.paymentTarget === "interest"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-green-50 text-green-700 border-green-200",
        label:
          tx.paymentTarget === "interest"
            ? "Repayment (Interest)"
            : tx.paymentTarget === "principal"
              ? "Repayment (Principal)"
              : "Repayment",
      },
      interest: {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Interest",
      },
      fine: {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        label: "Fine",
      },
    };
    const s = styles[tx.type] || {
      bg: "bg-slate-50 text-slate-700 border-slate-200",
      label: tx.type,
    };

    return (
      <span
        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.bg} whitespace-nowrap`}
      >
        {s.label}
      </span>
    );
  };

  return (
    <div className="p-1 sm:p-4 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Manage Loans
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track balances, apply interest cycles, and register payments.
          </p>
        </div>
        {selectedUserId && (
          <button
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={goBack}
          >
            ← Back to Overview
          </button>
        )}
      </div>

      {!selectedUserId ? (
        <>
          {allMembers.length === 0 ? (
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 text-center">
              <p className="text-slate-500 font-medium">
                No members found. Add users first via User Management.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Member</th>
                      <th className="px-6 py-4 text-right">
                        Principal Balance
                      </th>
                      <th className="px-6 py-4 text-right">Interest Balance</th>
                      <th className="px-6 py-4 text-right">
                        Total Outstanding
                      </th>
                      <th className="px-6 py-4 text-right">Total Disbursed</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {paginatedMembers.map((member) => (
                      <tr
                        key={member.userId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {member.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {member.email}
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-semibold ${(member.principalBalance || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}
                        >
                          ${(member.principalBalance || 0).toFixed(2)}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-semibold ${(member.interestBalance || 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          ${(member.interestBalance || 0).toFixed(2)}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-bold ${(member.totalOutstanding || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}
                        >
                          ${(member.totalOutstanding || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600 font-medium">
                          ${(member.totalDisbursed || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => fetchUserLedger(member.userId)}
                          >
                            View / Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 p-4">
                <Pagination
                  currentPage={overviewPage}
                  totalItems={allMembers.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setOverviewPage}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Ledger Section */}
          <div className="lg:col-span-2 space-y-6">
            {ledgerLoading ? (
              <div className="flex justify-center items-center h-48 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : userLedger ? (
              <>
                {/* Balance Summary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Principal Section Card */}
                  <div className="bg-white border-l-4 border-rose-500 rounded-xl shadow-sm p-5 border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Principal Balance
                    </div>
                    <div
                      className={`text-2xl font-extrabold ${summary.principalBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      ${summary.principalBalance.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
                      <span>
                        Disbursed:{" "}
                        <strong>${summary.totalDisbursed.toFixed(2)}</strong>
                      </span>
                      <span>
                        Repaid:{" "}
                        <strong>
                          ${summary.totalPrincipalRepaid.toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Interest Section Card */}
                  <div className="bg-white border-l-4 border-amber-500 rounded-xl shadow-sm p-5 border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Interest Balance
                    </div>
                    <div
                      className={`text-2xl font-extrabold ${summary.interestBalance > 0 ? "text-amber-700" : "text-emerald-600"}`}
                    >
                      ${summary.interestBalance.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 space-x-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span>
                        Acc:{" "}
                        <strong>
                          ${summary.totalInterestAccrued.toFixed(2)}
                        </strong>
                      </span>
                      <span>
                        • Fines:{" "}
                        <strong>${summary.totalFines.toFixed(2)}</strong>
                      </span>
                      <span>
                        • Paid:{" "}
                        <strong>
                          ${summary.totalInterestRepaid.toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Outstanding Hero Block */}
                <div
                  className={`border-l-4 p-4 rounded-xl shadow-sm border ${summary.totalOutstanding > 0 ? "bg-rose-50/50 border-rose-500" : "bg-emerald-50/50 border-emerald-500"}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-slate-700">
                      Total Outstanding Balance{" "}
                      <span className="text-xs text-slate-400 font-normal">
                        (Principal + Interest)
                      </span>
                    </span>
                    <span
                      className={`text-xl font-black ${summary.totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      ${summary.totalOutstanding.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Calculate Interest to Date Panel */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>📊</span> Calculate Interest to Date
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="date"
                        className="w-full sm:w-auto px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                        value={calcToDate}
                        onChange={(e) => setCalcToDate(e.target.value)}
                      />
                      <button
                        className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                        onClick={handleCalculateInterest}
                        disabled={calcLoading}
                      >
                        {calcLoading ? "Calculating..." : "🔢 Calculate"}
                      </button>
                    </div>
                  </div>

                  {showCalcPanel && interestCalc && (
                    <div className="pt-4 border-t border-slate-100 space-y-4 animate-fadeIn">
                      {/* Breakdown mini-cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                            Total Interest to Date
                          </div>
                          <div className="text-lg font-bold text-amber-600 mt-0.5">
                            ${interestCalc.totalInterestToDate.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-600/70">
                            Already Recorded
                          </div>
                          <div className="text-lg font-bold text-emerald-600 mt-0.5">
                            ${interestCalc.totalAlreadyRecorded.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3 text-center flex flex-col justify-between items-center gap-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-800/70">
                              Unrecorded Balance
                            </div>
                            <div className="text-lg font-bold text-amber-900 mt-0.5">
                              ${interestCalc.totalUnrecorded.toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="w-full py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 rounded shadow-sm transition-colors"
                            onClick={handleApplyUnrecordedInterest}
                            disabled={
                              interestCalc.totalUnrecorded <= 0 ||
                              applyingUnrecorded
                            }
                            aria-label="Apply unrecorded interest to loan balance"
                            title={
                              interestCalc.totalUnrecorded <= 0
                                ? "No unrecorded interest to apply"
                                : "Apply unrecorded interest to interest balance"
                            }
                          >
                            {applyingUnrecorded ? "Applying..." : "Apply All"}
                          </button>
                        </div>
                      </div>

                      {/* Period breakdown table */}
                      {interestCalc.periods.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-2">
                          No interest periods found. Ensure a loan disbursement
                          exists.
                        </p>
                      ) : (
                        <div className="overflow-x-auto border border-slate-100 rounded-lg">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                <th className="px-3 py-2">Period</th>
                                <th className="px-3 py-2 text-right">Days</th>
                                <th className="px-3 py-2 text-right">
                                  Principal
                                </th>
                                <th className="px-3 py-2 text-right">Rate</th>
                                <th className="px-3 py-2 text-right">
                                  Interest
                                </th>
                                <th className="px-3 py-2 text-center">
                                  Status
                                </th>
                                <th className="px-3 py-2 text-center">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {interestCalc.periods.map((period, idx) => (
                                <tr
                                  key={idx}
                                  className={`hover:bg-slate-50/80 transition-colors ${period.alreadyRecorded ? "bg-slate-50 text-slate-400" : period.isPartial ? "bg-amber-50/30" : "bg-white"}`}
                                >
                                  <td className="px-3 py-2 font-medium">
                                    {moment(period.periodStart).format("MMM D")}{" "}
                                    –{" "}
                                    {moment(period.periodEnd).format(
                                      "MMM D, YYYY",
                                    )}
                                    {period.isPartial && (
                                      <span className="ml-1.5 inline-block text-[10px] font-bold px-1 bg-amber-100 text-amber-800 rounded">
                                        partial
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {period.daysInPeriod}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium">
                                    ${period.principalBalance.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {(period.interestRate * 100).toFixed(1)}%
                                    {period.isPartial ? "*" : ""}
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-amber-700">
                                    ${period.interestAmount.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {period.alreadyRecorded ? (
                                      <span className="font-semibold text-emerald-600">
                                        ✓ Recorded
                                      </span>
                                    ) : (
                                      <span className="font-semibold text-amber-500">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {!period.alreadyRecorded && (
                                      <button
                                        className="px-2 py-0.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded transition-colors"
                                        onClick={() =>
                                          handleRecordInterestPeriod(period)
                                        }
                                        disabled={
                                          recordingPeriod ===
                                          period.periodStart.toString()
                                        }
                                      >
                                        {recordingPeriod ===
                                        period.periodStart.toString()
                                          ? "..."
                                          : "Record"}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {interestCalc.periods.some((p) => p.isPartial) && (
                            <p className="text-[10px] text-slate-400 p-2 bg-slate-50 border-t border-slate-100">
                              * Partial period interest is pro-rated: (principal
                              × 1% × days) ÷ 28
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Transaction Ledger Table Card */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800">
                      Full Ledger —{" "}
                      <span className="text-blue-600">
                        {userLedger.user.name}
                      </span>
                    </h3>
                  </div>
                  {transactions.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400 italic text-center">
                      No transactions yet. Add one using the form.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3 text-right">Amount</th>
                              <th className="px-4 py-3">Recorded By</th>
                              <th className="px-4 py-3">Note / Period</th>
                              <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {paginatedTx.map((tx) => (
                              <tr
                                key={tx._id}
                                className="hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                  {moment(tx.date).format("MMM Do YYYY")}
                                </td>
                                <td className="px-4 py-3">{txTypeBadge(tx)}</td>
                                <td
                                  className={`px-4 py-3 text-right font-semibold ${tx.type === "repayment" ? "text-emerald-600" : tx.type === "interest" ? "text-amber-600" : "text-slate-900"}`}
                                >
                                  {tx.type === "repayment" ? "-" : "+"}$
                                  {tx.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                  {tx.recordedBy?.name || "Auto"}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                                  {tx.type === "interest" &&
                                  tx.interestPeriod?.periodStart ? (
                                    <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                                      {moment(
                                        tx.interestPeriod.periodStart,
                                      ).format("MMM D")}{" "}
                                      –{" "}
                                      {moment(
                                        tx.interestPeriod.periodEnd,
                                      ).format("MMM D, YYYY")}{" "}
                                      @{" "}
                                      {(
                                        (tx.interestPeriod.interestRate ||
                                          0.01) * 100
                                      ).toFixed(1)}
                                      % on $
                                      {(
                                        tx.interestPeriod.principalBalance || 0
                                      ).toFixed(2)}
                                    </span>
                                  ) : (
                                    tx.note || "—"
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(tx)}
                                    aria-label={`Delete transaction of $${tx.amount.toFixed(2)} on ${moment(tx.date).format("MMM Do YYYY")}`}
                                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-600 rounded-md shadow-sm transition-all focus:outline-none"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-slate-200 p-4">
                        <Pagination
                          currentPage={ledgerPage}
                          totalItems={transactions.length}
                          itemsPerPage={ITEMS_PER_PAGE}
                          onPageChange={setLedgerPage}
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center">
                <p className="text-sm font-semibold text-rose-600">
                  Could not load ledger. Please try again.
                </p>
              </div>
            )}
          </div>

          {/* Add Transaction Form Column */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-5 lg:sticky lg:top-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Add Transaction
            </h3>
            <form onSubmit={handleSubmit(handleTxSubmit)} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Transaction Type
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                  {...register("type", { required: true })}
                >
                  <option value="">— Select Type —</option>
                  <option value="loan">New Loan (Disbursement)</option>
                  <option value="repayment">Repayment</option>
                  <option value="fine">Fine / Penalty</option>
                </select>
                {errors.type && (
                  <p className="text-xs text-rose-500 font-medium">
                    Please select a type
                  </p>
                )}
              </div>

              {/* Payment Target — only shown for repayments */}
              {watchType === "repayment" && (
                <div className="flex flex-col gap-1.5 animate-slideDown">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Apply Payment To
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    {...register("paymentTarget", {
                      required: watchType === "repayment",
                    })}
                  >
                    <option value="">— Select Target —</option>
                    <option value="interest">Interest Balance</option>
                    <option value="principal">Principal Balance</option>
                  </select>
                  {errors.paymentTarget && (
                    <p className="text-xs text-rose-500 font-medium">
                      Please select where to apply this payment
                    </p>
                  )}

                  <p className="text-[11px] text-blue-600 font-medium bg-blue-50 p-2 rounded border border-blue-100 mt-1">
                    {watch("paymentTarget") === "interest"
                      ? "💡 This payment will reduce the outstanding interest balance."
                      : watch("paymentTarget") === "principal"
                        ? "💡 This payment will reduce the outstanding principal balance."
                        : ""}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="0.00"
                  {...register("amount", { required: true, min: 0.01 })}
                />
                {errors.amount && (
                  <p className="text-xs text-rose-500 font-medium">
                    Enter a valid amount
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                  defaultValue={moment().format("YYYY-MM-DD")}
                  {...register("date", { required: true })}
                />
                {errors.date && (
                  <p className="text-xs text-rose-500 font-medium">
                    Date is required
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="e.g. Initial loan disbursement"
                  {...register("note")}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                disabled={txSubmitting}
              >
                {txSubmitting ? "Recording..." : "Record Transaction"}
              </button>
            </form>

            {/* Modernized Info Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>ℹ️</span> Interest Policy
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>
                  Interest is calculated on the{" "}
                  <strong className="text-slate-700">
                    principal balance only
                  </strong>
                </li>
                <li>
                  Interest is{" "}
                  <strong className="text-slate-700">never added</strong> to the
                  principal
                </li>
                <li>
                  Use{" "}
                  <strong className="text-slate-700">
                    "Calculate Interest"
                  </strong>{" "}
                  to check and record 4-week cycles
                </li>
                <li>Repayments must specify target balances clearly</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {deleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 p-4 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 transform scale-100 transition-transform">
            <div>
              <h3
                id="delete-modal-title"
                className="text-lg font-bold text-rose-600"
              >
                Delete Transaction
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                This action is permanent and cannot be undone. Balances will be
                re-derived dynamically.
              </p>
            </div>

            {/* Transaction Brief Box */}
            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                <span className="text-slate-400 font-medium">Type</span>
                <span className="font-semibold text-slate-900">
                  {deleteModal.tx.type}
                  {deleteModal.tx.paymentTarget
                    ? ` (${deleteModal.tx.paymentTarget})`
                    : ""}
                </span>
                <span className="text-slate-400 font-medium">Amount</span>
                <span className="font-bold text-rose-600">
                  $ {deleteModal.tx.amount.toFixed(2)}
                </span>
                <span className="text-slate-400 font-medium">Date</span>
                <span className="text-slate-900">
                  {moment(deleteModal.tx.date).format("MMM Do YYYY")}
                </span>
                {deleteModal.tx.note && (
                  <>
                    <span className="text-slate-400 font-medium">Note</span>
                    <span className="text-slate-900 break-words">
                      {deleteModal.tx.note}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Optional Reason Form Field */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                htmlFor="delete-reason"
              >
                Reason for deletion{" "}
                <span className="text-[10px] text-slate-400 font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="delete-reason"
                type="text"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white outline-none transition-all"
                placeholder="e.g. Entered in error"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={deleting}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTransaction}
                disabled={deleting}
                aria-label="Confirm permanent deletion of transaction"
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-colors ${deleting ? "bg-rose-300 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700"}`}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLoans;
