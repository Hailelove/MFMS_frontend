import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import moment from "moment";
import { useForm } from "react-hook-form";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 12;

const ManageLoans = () => {
  const [members, setMembers] = useState([]);
  const [loansOverview, setLoansOverview] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberLoans, setMemberLoans] = useState([]);
  const [loanLoading, setLoanLoading] = useState(false);

  //new
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const formatMoney = (val) => {
    const num = Number(val);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      loanTypeId: "",
      loanPurpose: "",
      requestedAmount: "",
      repaymentPeriod: "",
      approvedAmount: "",
      interestRate: "",
      paymentMethod: "CASH",
      repaymentAmount: "",
      referenceNo: "",
    },
  });

  const [txSubmitting, setTxSubmitting] = useState(false);

  const [overviewPage, setOverviewPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setMembers(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load members");
    }
  }, []);

  const fetchLoanTypes = useCallback(async () => {
    try {
      const res = await api.get("/admin/loan-types");
      setLoanTypes(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load loan types");
    }
  }, []);

  const fetchLoansOverview = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get("/admin/loans");
      setLoansOverview(res.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load loans overview",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoansOverview();
    fetchMembers();
    fetchLoanTypes();
  }, [fetchLoansOverview, fetchMembers, fetchLoanTypes]);

  const fetchMemberLoans = async (member) => {
    const memberId = member?.memberId || member?.id;

    if (!memberId) {
      toast.error("Cannot manage loans: member ID not found.");
      return;
    }

    setLoanLoading(true);
    setSelectedMemberId(memberId);
    setSelectedMember(member);
    setMemberLoans([]);
    setLedgerPage(1);

    try {
      const res = await api.get(`/admin/loans/member/${memberId}`);
      setMemberLoans(res.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load member loans",
      );
      setSelectedMemberId(null);
      setSelectedMember(null);
    } finally {
      setLoanLoading(false);
    }
  };
  const money = (value) => `ETB ${Number(value || 0).toFixed(2)}`;

  const statusStyles = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    QUEUED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    DISBURSED: "bg-purple-50 text-purple-700 border-purple-200",
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    COMPLETED: "bg-slate-50 text-slate-700 border-slate-200",
    OVERDUE: "bg-orange-50 text-orange-700 border-orange-200",
    DEFAULTED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const getLoanPaid = (loan) =>
    (loan.repayments || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

  const getLoanBalance = (loan) =>
    Math.max(
      Number(loan.approvedAmount || loan.requestedAmount || 0) -
        getLoanPaid(loan),
      0,
    );

  const paymentMethodOptions = [
    { value: "CASH", label: "Cash" },
    { value: "BANK", label: "Bank" },
    { value: "PAYROLL", label: "Payroll" },
  ];

  const handleCreateLoan = async (data) => {
    setTxSubmitting(true);

    try {
      await api.post(`/admin/loans/member/${selectedMemberId}`, {
        loanTypeId: Number(data.loanTypeId),
        loanPurpose: data.loanPurpose?.trim() || null,
        requestedAmount: Number(data.requestedAmount),
        repaymentPeriod: data.repaymentPeriod
          ? Number(data.repaymentPeriod)
          : null,
      });

      toast.success("Loan application created successfully");
      reset();
      await fetchMemberLoans(selectedMember);
      await fetchLoansOverview();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create loan");
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleApproveLoan = async (loan) => {
    const approvedAmount = window.prompt(
      "Enter Approved Amount:",
      formatMoney(loan.requestedAmount),
    );

    if (!approvedAmount) return;

    try {
      await api.patch(`/admin/loans/${loan.id}/approve`, {
        approvedAmount: Number(approvedAmount),
        // Use interestRate from loanType if not specified in loan
        interestRate: Number(
          loan.interestRate || loan.loanType?.interestRate || 0,
        ),
        repaymentPeriod: Number(loan.repaymentPeriod || 1),
      });

      toast.success("Loan approved and interest locked.");
      await fetchMemberLoans(selectedMember);
      await fetchLoansOverview();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approval failed.");
    }
  };

  const handleRejectLoan = async (loan) => {
    if (!window.confirm("Reject this loan application?")) return;

    try {
      await api.patch(`/admin/loans/${loan.id}/reject`);
      toast.success("Loan rejected");
      await fetchMemberLoans(selectedMember);
      await fetchLoansOverview();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject loan");
    }
  };

  const handleDisburseLoan = async (loan) => {
    if (
      !window.confirm(
        "Disburse this loan? This will initialize the repayment schedule.",
      )
    )
      return;

    try {
      await api.patch(`/admin/loans/${loan.id}/disburse`);
      toast.success("Loan disbursed successfully.");
      await fetchMemberLoans(selectedMember);
    } catch (error) {
      toast.error(error.response?.data?.message || "Disbursement failed.");
    }
  };

  const handleRepayment = async (loan) => {
    const amount = window.prompt("Repayment amount");

    if (!amount) return;

    try {
      await api.post(`/admin/loans/${loan.id}/repayments`, {
        amount: Number(amount),
        paymentMethod: watch("paymentMethod") || "CASH",
        referenceNo: watch("referenceNo") || null,
      });

      toast.success("Repayment recorded");
      await fetchMemberLoans(selectedMember);
      await fetchLoansOverview();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to record repayment",
      );
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

  const goBack = () => {
    setSelectedMemberId(null);
    setSelectedMember(null);
    setMemberLoans([]);
    setOverviewPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allMembers = members.map((member) => {
    const memberId = member.memberId || member.id;

    const overview = loansOverview.find(
      (item) => String(item.memberId || item.id) === String(memberId),
    );

    return {
      ...member,
      ...overview,
      id: memberId,
      memberId,
      fullName:
        overview?.fullName ||
        member.fullName ||
        member.name ||
        "Unnamed Member",
      email: overview?.email || member.email || member.user?.email || "",
      activeLoanBalance:
        overview?.activeLoanBalance ??
        member.memberBalance?.activeLoanBalance ??
        0,
      totalLoanPaid:
        overview?.totalLoanPaid ?? member.memberBalance?.totalLoanPaid ?? 0,
      activeLoans: overview?.activeLoans || 0,
    };
  });

  const paginatedMembers = allMembers.slice(
    (overviewPage - 1) * ITEMS_PER_PAGE,
    overviewPage * ITEMS_PER_PAGE,
  );

  const paginatedLoans = memberLoans.slice(
    (ledgerPage - 1) * ITEMS_PER_PAGE,
    ledgerPage * ITEMS_PER_PAGE,
  );

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
        {selectedMemberId && (
          <button
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={goBack}
          >
            ← Back to Overview
          </button>
        )}
      </div>

      {!selectedMemberId ? (
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
                        key={member.memberId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {member.fullName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {member.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-rose-600">
                          {money(member.activeLoanBalance)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                          {money(member.totalLoanPaid)}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600">
                          {member.activeLoans || 0}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => fetchMemberLoans(member)}
                            className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                          >
                            Manage Loans
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
            {loanLoading ? (
              <div className="flex justify-center items-center h-48 bg-white border border-slate-200 rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">
                    Loans for{" "}
                    <span className="text-blue-600">
                      {selectedMember?.fullName}
                    </span>
                  </h3>
                </div>

                {memberLoans.length === 0 ? (
                  <p className="p-6 text-sm text-slate-400 italic text-center">
                    No loans registered for this member.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                        <th className="px-4 py-3">Applied</th>
                        <th className="px-4 py-3">Loan Type</th>
                        <th className="px-4 py-3 text-right">Requested</th>
                        <th className="px-4 py-3 text-right">Approved</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedLoans.map((loan) => (
                        <tr key={loan.id}>
                          <td className="px-4 py-3">
                            {moment(loan.applicationDate).format("MMM D, YYYY")}
                          </td>
                          <td className="px-4 py-3">
                            {loan.loanType?.name || "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {money(loan.requestedAmount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {loan.approvedAmount
                              ? money(loan.approvedAmount)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {money(getLoanBalance(loan))}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs border ${statusStyles[loan.status] || statusStyles.PENDING}`}
                            >
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center space-x-2">
                            {loan.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApproveLoan(loan)}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectLoan(loan)}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {loan.status === "APPROVED" && (
                              <button
                                onClick={() => handleDisburseLoan(loan)}
                                className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
                              >
                                Disburse
                              </button>
                            )}

                            {["DISBURSED", "ACTIVE", "OVERDUE"].includes(
                              loan.status,
                            ) && (
                              <button
                                onClick={() => handleRepayment(loan)}
                                className="px-2 py-1 text-xs bg-emerald-600 text-white rounded"
                              >
                                Repay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="border-t border-slate-200 p-4">
                  <Pagination
                    currentPage={ledgerPage}
                    totalItems={memberLoans.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setLedgerPage}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add Transaction Form Column */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-5 lg:sticky lg:top-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Add Transaction
            </h3>

            <form
              onSubmit={handleSubmit(handleCreateLoan)}
              className="space-y-4"
            >
              <select {...register("loanTypeId", { required: true })}>
                <option value="">Select loan type</option>
                {loanTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {Number(type.interestRate)}%
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Loan purpose"
                {...register("loanPurpose")}
              />

              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="Requested amount"
                {...register("requestedAmount", { required: true, min: 1 })}
              />

              <input
                type="number"
                min="1"
                placeholder="Repayment period in months"
                {...register("repaymentPeriod")}
              />

              <button type="submit" disabled={txSubmitting}>
                {txSubmitting ? "Saving..." : "Create Loan Application"}
              </button>
            </form>
            <select {...register("paymentMethod")}>
              {paymentMethodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Repayment reference no."
              {...register("referenceNo")}
            />

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
