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

  // Tab state for toggling ledgers
  const [activeLedgerTab, setActiveLedgerTab] = useState("SAVINGS");

  const paymentMethodOptions = [
    { value: "CASH", label: "Cash" },
    { value: "BANK", label: "Bank" },
    { value: "PAYROLL", label: "Payroll" },
  ];

  const savingCategoryOptions = [
    { value: "INITIAL_SAVING", label: "Initial Saving" },
    { value: "MONTHLY_SAVING", label: "Monthly Saving" },
    { value: "ADDITIONAL_SAVING", label: "Additional Saving" },
    { value: "WITHDRAWAL", label: "Withdrawal" },
    { value: "ADJUSTMENT", label: "Adjustment" },
  ];

  const shareTransactionOptions = [
    { value: "INITIAL_SHARE", label: "Initial Share" },
    { value: "ADDITIONAL_SHARE", label: "Additional Share" },
    { value: "ADJUSTMENT", label: "Adjustment" },
  ];

  const getSavingType = (category) => {
    if (category === "WITHDRAWAL") return "WITHDRAWAL";
    if (category === "ADJUSTMENT") return "ADJUSTMENT";
    return "DEPOSIT";
  };
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      entryType: "SAVING",
      transactionDate: moment().format("YYYY-MM-DD"),
      paymentMethod: "CASH",
      category: "MONTHLY_SAVING",
      shareTransactionType: "ADDITIONAL_SHARE",
      quantity: 1,
      unitPrice: 100,
      amount: "",
      payrollMonth: "",
      referenceNo: "",
      remarks: "",
    },
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const paymentMethod = watch("paymentMethod");

  // Watch fields for dynamic UI changes
  const entryType = watch("entryType");
  const watchQuantity = watch("quantity");
  const watchUnitPrice = watch("unitPrice");

  // Delete modal state
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
      // Assuming backend returns an array with user summaries including totalShares
      const response = await api.get("/admin/savings");
      setSavingsOverview(response.data);
    } catch (error) {
      toast.error(
        "Failed to load overview: " +
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
    // DEBUGGING: Log exactly what is being passed
    console.log("Button clicked with:", { userId, name });

    if (userId === undefined || userId === null) {
      console.error(
        "CRITICAL: userId is undefined! Check your map function data.",
      );
      toast.error("Cannot manage account: User ID not found.");
      return;
    }

    setSelectedUserId(userId);
    setSelectedUserName(name);
    setDetailLoading(true);
    setUserSavingsDetail(null);
    setHistoryPage(1);
    setActiveLedgerTab("SAVINGS");
    try {
      // Backend should return { totalSavings, totalShares, savings: [], shares: [] }
      const response = await api.get(`/admin/member-finance/${userId}`);
      setUserSavingsDetail(response.data);
    } catch (error) {
      toast.error(
        "Failed to load financial details: " +
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
      // Map data according to Prisma Schema
      const payload = {
        paymentMethod: data.paymentMethod,
        referenceNo: data.referenceNo?.trim() || null,
        remarks: data.remarks?.trim() || null,
      };

      if (data.paymentMethod === "PAYROLL" && data.payrollMonth) {
        payload.payrollMonth = `${data.payrollMonth}-01`;
      }

      let endpoint = "";

      if (data.entryType === "SAVING") {
        endpoint = `/admin/savings/${selectedUserId}/transaction`;

        payload.category = data.category;
        payload.type = getSavingType(data.category);
        payload.amount = Number(data.amount);
        payload.transactionDate = data.transactionDate;
        payload.isInitialTransaction = data.category === "INITIAL_SAVING";

        Object.assign(payload, payload);
      } else {
        endpoint = `/admin/shares/${selectedUserId}/transaction`;

        payload.transactionType = data.shareTransactionType;
        payload.quantity = Number(data.quantity);
        payload.unitPrice = Number(data.unitPrice);
        payload.totalAmount = Number(data.quantity) * Number(data.unitPrice);
        payload.contributionDate = data.transactionDate;
        payload.isInitialTransaction =
          data.shareTransactionType === "INITIAL_SHARE";

        Object.assign(payload, payload);
      }

      await api.post(endpoint, payload);
      toast.success(
        `${data.entryType === "SAVING" ? "Saving" : "Share"} transaction recorded successfully`,
      );

      reset({
        ...data,
        amount: "",
        referenceNo: "",
        remarks: "",
        transactionDate: moment().format("YYYY-MM-DD"),
      });

      openUserDetail(selectedUserId, selectedUserName);
      fetchSavingsOverview();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to record transaction",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const openDeleteModal = (record, type) => {
    setDeleteModal({ record, type });
    setDeleteReason("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(null);
    setDeleteReason("");
  };

  const handleDeleteRecord = async () => {
    if (!deleteModal || deleting) return;
    const { record, type } = deleteModal;
    setDeleting(true);
    try {
      const endpoint =
        type === "SAVING"
          ? `/admin/savings/${selectedUserId}/transaction/${record.id}`
          : `/admin/shares/${selectedUserId}/transaction/${record.id}`;

      await api.delete(endpoint, { data: { reason: deleteReason.trim() } });
      toast.success("Transaction deleted successfully");
      setDeleteModal(null);
      setDeleteReason("");
      openUserDetail(selectedUserId, selectedUserName);
      fetchSavingsOverview();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete transaction",
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
    const memberId = u.id;
    const fullName = u.fullName || u.name || "Unnamed Member";

    const savRow = savingsOverview.find(
      (s) =>
        String(s.memberId) === String(memberId) ||
        String(s.id) === String(memberId) ||
        String(s.userId) === String(u.userId),
    );

    return (
      savRow || {
        id: memberId,
        memberId,
        userId: u.userId,
        fullName,
        email: u.email,
        totalSavings: u.memberBalance?.savingBalance || 0,
        totalShares: u.memberBalance?.shareBalance || 0,
        lastTransaction: null,
      }
    );
  });

  const paginatedMembers = allMembers.slice(
    (overviewPage - 1) * ITEMS_PER_PAGE,
    overviewPage * ITEMS_PER_PAGE,
  );

  // Use the active tab to determine which list to paginate
  const activeRecords =
    activeLedgerTab === "SAVINGS"
      ? userSavingsDetail?.savings || []
      : userSavingsDetail?.shares || [];

  const paginatedRecords = activeRecords.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen text-slate-800 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Cooperative Financials
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {selectedUserId
              ? `Financial timeline for ${selectedUserName}`
              : "Manage member savings and share (እጣ) contributions."}
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
            <span>Back to Directory</span>
          </button>
        )}
      </div>

      {!selectedUserId ? (
        <>
          {allMembers.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
              <p className="text-slate-500 text-sm">
                No members found. Add members via Registration first.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Member</th>
                      <th className="px-6 py-4">Total Savings</th>
                      <th className="px-6 py-4">Total Shares (እጣ)</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedMembers.map((member) => (
                      <tr
                        key={member.memberId || member.id}
                        className="hover:bg-slate-50/60 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {member.fullName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {member.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600 font-mono">
                          ETB{(member.totalSavings || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600 font-mono">
                          ETB{(member.totalShares || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 py-1.5 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-300"
                            onClick={() =>
                              openUserDetail(
                                member.memberId || member.id,
                                member.fullName,
                              )
                            }
                          >
                            Manage Accounts
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {detailLoading ? (
              <div className="flex justify-center items-center h-48 bg-white border border-slate-200 rounded-2xl">
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
              </div>
            ) : userSavingsDetail ? (
              <>
                {/* Metric Profile Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
                    <div className="text-emerald-800 text-xs font-bold uppercase tracking-wider">
                      Total Savings
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-900 mt-2 font-mono">
                      ETB {(userSavingsDetail.totalSavings || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shadow-sm">
                    <div className="text-blue-800 text-xs font-bold uppercase tracking-wider">
                      Total Share Value (እጣ)
                    </div>
                    <div className="text-2xl font-extrabold text-blue-900 mt-2 font-mono">
                      ETB{(userSavingsDetail.totalShares || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Ledger Registry Block */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex border-b border-slate-200">
                    <button
                      className={`flex-1 py-4 text-sm font-bold tracking-wide uppercase transition-colors ${activeLedgerTab === "SAVINGS" ? "bg-white text-emerald-600 border-b-2 border-emerald-600" : "bg-slate-50 text-slate-500 hover:text-slate-700"}`}
                      onClick={() => {
                        setActiveLedgerTab("SAVINGS");
                        setHistoryPage(1);
                      }}
                    >
                      Savings Ledger
                    </button>
                    <button
                      className={`flex-1 py-4 text-sm font-bold tracking-wide uppercase transition-colors ${activeLedgerTab === "SHARES" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-slate-50 text-slate-500 hover:text-slate-700"}`}
                      onClick={() => {
                        setActiveLedgerTab("SHARES");
                        setHistoryPage(1);
                      }}
                    >
                      Shares (እጣ) Ledger
                    </button>
                  </div>

                  {activeRecords.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400 italic text-center">
                      No transactions recorded in this ledger.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                              <th className="px-6 py-3">Date</th>
                              <th className="px-6 py-3">
                                {activeLedgerTab === "SAVINGS"
                                  ? "Category"
                                  : "Qty / Price"}
                              </th>
                              <th className="px-6 py-3">Method</th>
                              <th className="px-6 py-3 text-right">Amount</th>
                              <th className="px-6 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {paginatedRecords.map((record) => (
                              <tr
                                key={record.id}
                                className="hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-6 py-3 text-slate-700 font-medium">
                                  {moment(
                                    activeLedgerTab === "SAVINGS"
                                      ? record.transactionDate
                                      : record.contributionDate,
                                  ).format("MMM Do YYYY")}
                                </td>
                                <td className="px-6 py-3 text-slate-500 text-xs">
                                  {activeLedgerTab === "SAVINGS"
                                    ? record.category.replace("_", " ")
                                    : `${record.quantity} @ $${parseFloat(record.unitPrice).toFixed(2)}`}
                                </td>
                                <td className="px-6 py-3 text-slate-500 text-xs">
                                  {record.paymentMethod.replace("_", " ")}
                                </td>
                                <td className="px-6 py-3 text-right font-bold font-mono text-slate-700">
                                  $
                                  {parseFloat(
                                    activeLedgerTab === "SAVINGS"
                                      ? record.amount
                                      : record.totalAmount,
                                  ).toFixed(2)}
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <button
                                    onClick={() =>
                                      openDeleteModal(
                                        record,
                                        activeLedgerTab === "SAVINGS"
                                          ? "SAVING"
                                          : "SHARE",
                                      )
                                    }
                                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
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
                          totalItems={activeRecords.length}
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
                Could not load member financial details.
              </div>
            )}
          </div>

          {/* Combined Transaction Entry Form */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase mb-6 pb-2 border-b border-slate-200">
              New Transaction Entry
            </h3>
            <form
              onSubmit={handleSubmit(onSubmitPayment)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Transaction Type *
                </label>
                <select
                  {...register("entryType")}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="SAVING">Savings Deposit</option>
                  <option value="SHARE">Share (እጣ) Contribution</option>
                </select>
              </div>

              {entryType === "SAVING" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      Category *
                    </label>
                    {/* <select
                      {...register("category")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="MONTHLY_SAVING">Monthly Saving</option>
                      <option value="ADDITIONAL_SAVING">
                        Additional Saving
                      </option>
                    </select> */}
                    <select
                      {...register("category")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      {savingCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      {...register("amount", {
                        required: "Amount is required",
                      })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      Share Transaction *
                    </label>
                    {/* <select
                      {...register("shareTransactionType")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="INITIAL_SHARE">Initial Share</option>
                      <option value="ADDITIONAL_SHARE">Additional Share</option>
                    </select> */}
                    <select
                      {...register("shareTransactionType")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      {shareTransactionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register("quantity", { required: "Qty required" })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono outline-none"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("unitPrice", {
                          required: "Price required",
                        })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono outline-none"
                        placeholder="Price"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-right">
                    <span className="text-[10px] text-blue-600 uppercase font-bold mr-2">
                      Calculated Total:
                    </span>
                    <span className="text-sm font-bold font-mono text-blue-900">
                      $
                      {((watchQuantity || 0) * (watchUnitPrice || 0)).toFixed(
                        2,
                      )}
                    </span>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                    Payment Method *
                  </label>
                  {/* <select
                    {...register("paymentMethod")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="PAYROLL_DEDUCTION">Payroll Deduction</option>
                  </select> */}
                  <select
                    {...register("paymentMethod")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                    Date *
                  </label>
                  <input
                    type="date"
                    {...register("transactionDate")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              {paymentMethod === "PAYROLL" && (
                <div className="space-y-1.5">
                  <label className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                    Payroll Month
                  </label>
                  <input
                    type="month"
                    {...register("payrollMonth")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                  Remarks / Ref No. (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...register("referenceNo")}
                    placeholder="Ref #"
                    className="w-1/3 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <input
                    type="text"
                    {...register("remarks")}
                    placeholder="Notes..."
                    className="w-2/3 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm disabled:opacity-50 mt-4"
              >
                {submitLoading
                  ? "Processing..."
                  : `Record ${entryType === "SAVING" ? "Saving" : "Share"} Entry`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-red-600">
              Purge Ledger Record
            </h3>
            <p className="text-slate-500 text-xs">
              Permanent deletion sequence. Ledger totals will be recalculated.
            </p>
            <input
              type="text"
              placeholder="Reason for deletion (Optional)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              disabled={deleting}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none mt-4"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 text-slate-600 text-sm font-semibold border rounded-xl"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl"
                onClick={handleDeleteRecord}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSavings;
