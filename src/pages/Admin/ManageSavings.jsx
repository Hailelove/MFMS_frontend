import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import moment from "moment";
import { useForm } from "react-hook-form";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 12;

const ManageSavings = () => {
  const [users, setUsers] = useState([]);
  const [savingsOverview, setSavingsOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [userSavingsDetail, setUserSavingsDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      paidOn: moment().format("YYYY-MM-DD"),
      weekStartDate: moment().startOf("isoWeek").format("YYYY-MM-DD"),
    },
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Delete-payment state
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Pagination state
  const [overviewPage, setOverviewPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const fetchSavingsOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/savings");
      setSavingsOverview(response.data);
    } catch (error) {
      toast.error(
        "Failed to load savings overview: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavingsOverview();
    fetchUsers();
  }, [fetchSavingsOverview, fetchUsers]);

  const openUserDetail = async (userId, name) => {
    setSelectedUserId(userId);
    setSelectedUserName(name);
    setDetailLoading(true);
    setUserSavingsDetail(null);
    setHistoryPage(1);
    try {
      const response = await api.get(`/admin/savings/${userId}`);
      setUserSavingsDetail(response.data);
    } catch (error) {
      toast.error(
        "Failed to load savings details: " +
          (error.response?.data?.message || error.message),
      );
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const onSubmitPayment = async (data) => {
    setSubmitLoading(true);
    try {
      await api.post(`/admin/savings/${selectedUserId}/payment`, {
        amount: parseFloat(data.amount),
        paidOn: data.paidOn,
        weekStartDate: data.weekStartDate,
        note: data.note || "",
      });
      toast.success("Savings payment recorded successfully");
      reset({
        amount: "",
        note: "",
        paidOn: moment().format("YYYY-MM-DD"),
        weekStartDate: moment().startOf("isoWeek").format("YYYY-MM-DD"),
      });
      openUserDetail(selectedUserId, selectedUserName);
      fetchSavingsOverview();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record saving");
    } finally {
      setSubmitLoading(false);
    }
  };

  const openDeleteModal = (payment) => {
    setDeleteModal({ payment });
    setDeleteReason("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(null);
    setDeleteReason("");
  };

  const handleDeletePayment = async () => {
    if (!deleteModal || deleting) return;
    const { payment } = deleteModal;
    setDeleting(true);
    try {
      const res = await api.delete(
        `/admin/savings/${selectedUserId}/payment/${payment._id}`,
        { data: { reason: deleteReason.trim() } },
      );
      toast.success("Savings payment deleted successfully");
      setDeleteModal(null);
      setDeleteReason("");
      if (res.data?.summaryAfter) {
        setUserSavingsDetail((prev) =>
          prev
            ? {
                ...prev,
                totalSavings: res.data.summaryAfter.totalSavings,
                savingsInterest: res.data.summaryAfter.savingsInterest,
                payments: prev.payments.filter((p) => p._id !== payment._id),
              }
            : null,
        );
      }
      fetchSavingsOverview();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete savings payment",
      );
    } finally {
      setDeleting(false);
    }
  };

  const goBack = () => {
    setSelectedUserId(null);
    setUserSavingsDetail(null);
    setOverviewPage(1);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96 bg-white rounded-2xl border border-slate-200">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 border-r-transparent animate-spin"></div>
        </div>
      </div>
    );

  const allMembers = users.map((u) => {
    const savRow = savingsOverview.find(
      (s) => String(s.userId) === String(u._id),
    );
    return (
      savRow || {
        userId: u._id,
        name: u.name,
        email: u.email,
        totalSavings: 0,
        savingsInterest: 0,
        paymentsCount: 0,
        lastPaidOn: null,
      }
    );
  });

  const paginatedMembers = allMembers.slice(
    (overviewPage - 1) * ITEMS_PER_PAGE,
    overviewPage * ITEMS_PER_PAGE,
  );

  const payments = userSavingsDetail?.payments || [];
  const paginatedPayments = payments.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen text-slate-800 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
      {/* Dynamic Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Savings
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {selectedUserId
              ? `Financial timeline for ${selectedUserName}`
              : "Core liquidity pools and member records registry."}
          </p>
        </div>
        {selectedUserId && (
          <button
            className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm self-start sm:self-auto group"
            onClick={goBack}
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Overview</span>
          </button>
        )}
      </div>

      {!selectedUserId ? (
        <>
          {allMembers.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
              <p className="text-slate-500 text-sm">
                No members found. Add users first via User Management.
              </p>
            </div>
          ) : (
            /* Registry Table Dashboard */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Member Structure</th>
                      <th className="px-6 py-4">Total Savings</th>
                      <th className="px-6 py-4">Interest (1%)</th>
                      <th className="px-6 py-4">Payments</th>
                      <th className="px-6 py-4">Last Capital Entry</th>
                      <th className="px-6 py-4 text-right">Action Layer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedMembers.map((member) => (
                      <tr
                        key={member.userId}
                        className="hover:bg-slate-50/60 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {member.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {member.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600 font-mono">
                          ${(member.totalSavings || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-indigo-600 font-mono">
                          ${(member.savingsInterest || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {member.paymentsCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {member.lastPaidOn ? (
                            moment(member.lastPaidOn).format("MMM Do YYYY")
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              No entries
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 py-1.5 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-300 hover:scale-[1.02]"
                            onClick={() =>
                              openUserDetail(member.userId, member.name)
                            }
                          >
                            View / Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
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
        /* Workspace Split Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Detailed Transaction Flow Structure */}
          <div className="lg:col-span-2 space-y-6">
            {detailLoading ? (
              <div className="flex justify-center items-center h-48 bg-white border border-slate-200 rounded-2xl">
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
              </div>
            ) : userSavingsDetail ? (
              <>
                {/* Metric Profile Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
                    <div className="text-emerald-800 text-xs font-bold uppercase tracking-wider">
                      Total Savings
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-900 mt-2 font-mono">
                      ${(userSavingsDetail.totalSavings || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl shadow-sm">
                    <div className="text-indigo-800 text-xs font-bold uppercase tracking-wider">
                      Accumulated Interest
                    </div>
                    <div className="text-2xl font-extrabold text-indigo-900 mt-2 font-mono">
                      ${(userSavingsDetail.savingsInterest || 0).toFixed(2)}
                    </div>
                  </div>

                  <div
                    className={`border p-5 rounded-2xl shadow-sm ${
                      userSavingsDetail.currentWeekPaid
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div
                      className={`text-xs font-bold uppercase tracking-wider ${userSavingsDetail.currentWeekPaid ? "text-emerald-800" : "text-amber-800"}`}
                    >
                      Term Framework
                    </div>
                    <div
                      className={`text-xl font-bold mt-2 flex items-center space-x-2 ${
                        userSavingsDetail.currentWeekPaid
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${userSavingsDetail.currentWeekPaid ? "bg-emerald-500" : "bg-amber-500"}`}
                      ></span>
                      <span className="text-sm font-semibold">
                        {userSavingsDetail.currentWeekPaid
                          ? "Current Week Paid"
                          : "Payment Obligation Due"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Statement History Registry Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-700 tracking-wide text-xs uppercase">
                      Savings Ledger — {selectedUserName}
                    </h3>
                  </div>
                  {payments.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400 italic">
                      No matching atomic entries validated. Use core form
                      parameters to insert ledger values.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                              <th className="px-6 py-3.5">Target Cycle Week</th>
                              <th className="px-6 py-3.5">
                                Execution Timestamp
                              </th>
                              <th className="px-6 py-3.5">
                                Quantum Matrix Amount
                              </th>
                              <th className="px-6 py-3.5">
                                Authority Verification
                              </th>
                              <th className="px-6 py-3.5">
                                System Note Context
                              </th>
                              <th className="px-6 py-3.5 text-right">
                                Ledger Control
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {paginatedPayments.map((payment) => (
                              <tr
                                key={payment._id}
                                className="hover:bg-slate-50/50 transition-colors group"
                              >
                                <td className="px-6 py-3.5 text-slate-700">
                                  {moment(payment.weekStartDate).format(
                                    "MMM Do YYYY",
                                  )}
                                </td>
                                <td className="px-6 py-3.5 text-slate-500">
                                  {moment(payment.paidOn).format("MMM Do YYYY")}
                                </td>
                                <td className="px-6 py-3.5 font-bold text-emerald-600 font-mono">
                                  ${(payment.amount || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-3.5 text-slate-600">
                                  {payment.recordedBy?.name || "—"}
                                </td>
                                <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">
                                  {payment.note || "—"}
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(payment)}
                                    className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                        <Pagination
                          currentPage={historyPage}
                          totalItems={payments.length}
                          itemsPerPage={ITEMS_PER_PAGE}
                          onPageChange={setHistoryPage}
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm">
                Could not load savings details. Please try again.
              </div>
            )}
          </div>

          {/* New Transaction Ledger Processing Entry Block Form */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase mb-6 pb-2 border-b border-slate-200">
              Record Entry Matrix
            </h3>
            <form
              onSubmit={handleSubmit(onSubmitPayment)}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 200"
                  {...register("amount", {
                    required: "Amount is required",
                    min: { value: 1, message: "Min $1" },
                  })}
                />
                {errors.amount && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Paid On *
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  {...register("paidOn", { required: "Date is required" })}
                />
                {errors.paidOn && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.paidOn.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Week Start Date *
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  {...register("weekStartDate", {
                    required: "Week start date is required",
                  })}
                />
                <p className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                  Target cycle reference monday alignment anchor.
                </p>
                {errors.weekStartDate && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.weekStartDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Paid cash at meeting"
                  {...register("note")}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all transform hover:scale-[1.01] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                disabled={submitLoading}
              >
                {submitLoading
                  ? "Writing Record Matrix..."
                  : "Commit Payment Execution"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Deletion Interactive Modal UI Dialog Layer ── */}
      {deleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-savings-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full shadow-xl space-y-4 transform scale-100 transition-all">
            <div>
              <h3
                id="delete-savings-modal-title"
                className="text-lg font-bold text-red-600 tracking-tight"
              >
                Purge Ledger Transaction Record
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Permanent system deletion sequence. Liquidity totals will be
                instantly recalculated across registry pipelines.
              </p>
            </div>

            {/* Atomic Payload Overview Block */}
            <div className="bg-slate-50 border border-red-100 rounded-xl p-4 text-xs font-mono space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-400 uppercase">Target Week:</span>
                <span className="text-slate-800 font-bold">
                  {moment(deleteModal.payment.weekStartDate).format(
                    "MMM Do YYYY",
                  )}
                </span>

                <span className="text-slate-400 uppercase">Timestamp:</span>
                <span className="text-slate-600">
                  {moment(deleteModal.payment.paidOn).format("MMM Do YYYY")}
                </span>

                <span className="text-slate-400 uppercase">Value Quantum:</span>
                <span className="text-red-600 font-bold">
                  ${deleteModal.payment.amount.toFixed(2)}
                </span>

                {deleteModal.payment.note && (
                  <>
                    <span className="text-slate-400 uppercase">
                      Trace Note:
                    </span>
                    <span className="text-slate-600 break-words">
                      {deleteModal.payment.note}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Optional Auditing Reason Interface */}
            <div className="space-y-1.5">
              <label
                className="text-slate-500 text-[10px] font-bold uppercase tracking-wider"
                htmlFor="delete-savings-reason"
              >
                Auditing Deletion Reason (Optional)
              </label>
              <input
                id="delete-savings-reason"
                type="text"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                placeholder="e.g. Error configuration override"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={deleting}
              />
            </div>

            {/* Execution Actions Dashboard Wrap */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                className="bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleDeletePayment}
                disabled={deleting}
                aria-label="Confirm permanent deletion of savings payment"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Purging..." : "Execute Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSavings;
