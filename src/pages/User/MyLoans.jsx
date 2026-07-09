import React, { useMemo, useState, useEffect } from "react";
import api from "../../services/api";

import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  History,
  Landmark,
  ListChecks,
  PiggyBank,
  Plus,
  ReceiptText,
  Send,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  XCircle,
  Loader2,
} from "lucide-react";

// --- Utilities ---
const currency = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Queued: "bg-sky-50 text-sky-700 border-sky-200",
  Disbursed: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatCurrency = (value) => currency.format(Number(value) || 0);

const calculateMonthlyPayment = (principal, months, annualRate = 0.12) => {
  const amount = Number(principal) || 0;
  const period = Number(months) || 1;
  const monthlyRate = annualRate / 12;
  if (!amount) return 0;
  return (
    (amount * monthlyRate * Math.pow(1 + monthlyRate, period)) /
    (Math.pow(1 + monthlyRate, period) - 1)
  );
};

const downloadCsv = (rows, filename) => {
  if (!rows || rows.length === 0) return;
  const headers = [
    "No",
    "Due Date",
    "Principal",
    "Interest",
    "Total",
    "Balance",
    "Status",
  ];
  const csvRows = rows.map((row) => [
    row.no,
    row.dueDate,
    row.principal,
    row.interest,
    row.total,
    row.balance,
    row.status,
  ]);
  const csv = [headers, ...csvRows]
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// --- Subcomponents ---
const StatCard = ({ icon: Icon, label, value, helper, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`rounded-lg p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </span>
      </div>
      {helper && <p className="mt-4 text-sm text-slate-500">{helper}</p>}
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Pending}`}
  >
    {status || "Unknown"}
  </span>
);

const PreviewRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 bg-white">
    <div className="flex items-center gap-3">
      <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon size={17} />
      </span>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
    <span className="text-right text-sm font-bold text-slate-950">{value}</span>
  </div>
);

const Modal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = "max-w-4xl",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl bg-slate-50 shadow-2xl border border-slate-200`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <Icon size={20} />
              </span>
            )}
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Main Component ---
const MyLoan = () => {
  const initialForm = {
    loanTypeId: "",
    requestedAmount: "",
    purpose: "",
    repaymentPeriod: "12",
    guarantors: "",
    remarks: "",
    documents: null,
  };

  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeModal, setActiveModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- API State Data ---
  const [loanTypes, setLoanTypes] = useState([]);
  const [memberSummary, setMemberSummary] = useState({
    name: "",
    savingBalance: 0,
    shareBalance: 0,
    existingLoanBalance: 0,
    monthlyIncome: 0,
  });
  const [currentLoan, setCurrentLoan] = useState(null);
  const [loanHistory, setLoanHistory] = useState([]);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [applicationStatuses, setApplicationStatuses] = useState([]);

  // --- Fetch Data on Mount ---
  // --- Fetch Data on Mount ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Run both fetches in parallel to speed up load times
        // Ensure these paths match your exact Express routes!
        const [dashboardResponse, loanTypesResponse] = await Promise.all([
          api.get("/loans/dashboard"), // Calls getMemberLoanDashboard
          api.get("/loans/loan-types"), // Calls getActiveLoanTypes
        ]);

        const dashboardData = dashboardResponse.data;

        // Hydrate all states with the unified backend response
        setMemberSummary(dashboardData.memberSummary);
        setCurrentLoan(dashboardData.currentLoan);
        setLoanHistory(dashboardData.loanHistory);
        setRepaymentSchedule(dashboardData.repaymentSchedule);
        setApplicationStatuses(dashboardData.applicationStatuses);

        // Hydrate the dropdown options
        setLoanTypes(loanTypesResponse.data);
      } catch (err) {
        console.error("Error setting up loan dashboard:", err);
        setError(
          err.response?.data?.message ||
            "Failed to fetch loan data. Please ensure you are logged in.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCloseModal = () => {
    setActiveModal(null);
    setMessage({ type: "", text: "" });
  };

  // --- Derived Calculations ---
  const repaymentProgress =
    currentLoan && currentLoan.totalInstallments
      ? (currentLoan.completedInstallments / currentLoan.totalInstallments) *
        100
      : 0;

  const selectedLoanType = useMemo(() => {
    if (!form.loanTypeId) return null;
    return loanTypes.find(
      (t) => t.id.toString() === form.loanTypeId.toString(),
    );
  }, [loanTypes, form.loanTypeId]);

  // --- Maximum Loan Allowance Logic (Kept Intact) ---
  const maximumLoanAmount = useMemo(() => {
    if (!selectedLoanType) return 0;

    const multiplier = Number(selectedLoanType.maxMultiplier) || 0;
    const totalAssets =
      (Number(memberSummary.savingBalance) || 0) +
      (Number(memberSummary.shareBalance) || 0);

    const maxEligibility = totalAssets * multiplier;
    const netEligibility =
      maxEligibility - (Number(memberSummary.existingLoanBalance) || 0);

    return Math.max(netEligibility, 0);
  }, [memberSummary, selectedLoanType]);

  if (isLoading)
    return (
      <div className="p-6 text-slate-500">Loading your profile details...</div>
    );
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const requestedAmount = Number(form.requestedAmount) || 0;

  const estimatedMonthlyRepayment = calculateMonthlyPayment(
    requestedAmount,
    form.repaymentPeriod,
    selectedLoanType?.interestRate
      ? Number(selectedLoanType.interestRate) / 100
      : 0.12,
  );

  const eligibilityStatus =
    requestedAmount > 0 &&
    requestedAmount <= maximumLoanAmount &&
    estimatedMonthlyRepayment <= memberSummary.monthlyIncome * 0.45;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  // --- API Submission Handler ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // Create FormData to handle the file upload mapped to backend Multer
      const formData = new FormData();
      formData.append("loanTypeId", form.loanTypeId);
      formData.append("requestedAmount", requestedAmount);
      formData.append("purpose", form.purpose);
      formData.append("repaymentPeriod", form.repaymentPeriod);
      formData.append("guarantors", form.guarantors);
      formData.append("remarks", form.remarks);

      if (form.documents) {
        // Must match 'req.file' in your backend middleware (e.g., upload.single('document'))
        formData.append("document", form.documents);
      }

      // Calls applyForLoan in your backend controller
      const response = await api.post("/loans/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Optimistically update the UI history table & statuses without refreshing
      setLoanHistory((current) => [response.data.newLoan, ...current]);
      setApplicationStatuses((current) => [
        {
          id: response.data.newLoan.id,
          status: response.data.newLoan.status,
          requestedAmount: response.data.newLoan.requestedAmount,
          date: response.data.newLoan.createdAt,
        },
        ...current,
      ]);

      setForm(initialForm);
      setMessage({
        type: "success",
        text: "Loan application submitted successfully and is pending review.",
      });
    } catch (error) {
      console.error("Submission failed:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to submit application. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // const response = await api.post("/loans/apply", formData, {
  //   headers: { "Content-Type": "multipart/form-data" },
  // });
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-sm font-medium text-slate-500">
            Loading your loan profile...
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-red-50 rounded-xl border border-red-200 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="text-red-500" size={48} />
          <p className="text-lg font-bold text-red-700">Unable to load data</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Member Loan Management
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              My Loans
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              View loan eligibility, repayment progress, and manage
              applications.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">Member</p>
            <p className="font-bold text-slate-950">
              {memberSummary.name || "Unknown Member"}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Actions Panel */}
        <section className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setActiveModal("history")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          >
            <History size={18} /> View Loan History
          </button>
          <button
            onClick={() => setActiveModal("application")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> New Loan Application
          </button>
        </section>

        {/* Stats Grid */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Banknote}
            label="Current Loan Balance"
            value={formatCurrency(currentLoan?.balance || 0)}
            helper={
              currentLoan
                ? `Loan ${currentLoan.id} is ${currentLoan.status.toLowerCase()}.`
                : "No active loan."
            }
          />
          <StatCard
            icon={ShieldCheck}
            label="Available Eligibility"
            value={formatCurrency(maximumLoanAmount)}
            helper="Calculated from savings, shares, and existing balance."
            tone="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Maximum Loan Amount"
            value={formatCurrency(maximumLoanAmount)}
            helper="Subject to guarantor and committee approval."
            tone="amber"
          />
          <StatCard
            icon={Wallet}
            label="Remaining Balance"
            value={formatCurrency(currentLoan?.balance || 0)}
            helper={
              currentLoan
                ? `${currentLoan.totalInstallments - currentLoan.completedInstallments} installments remaining.`
                : "No active loan."
            }
            tone="slate"
          />
        </section>

        {/* Dashboard Panels */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Current Loan Progress */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Loan Dashboard
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Repayment progress for current active loan.
                </p>
              </div>
              {currentLoan && <StatusBadge status={currentLoan.status} />}
            </div>

            {currentLoan ? (
              <>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      Repayment progress
                    </span>
                    <span className="text-slate-500">
                      {currentLoan.completedInstallments}/
                      {currentLoan.totalInstallments}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${repaymentProgress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <p className="text-sm text-slate-500">Next payment</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {formatCurrency(currentLoan.nextPaymentAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <p className="text-sm text-slate-500">Next due date</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {currentLoan.nextPaymentDate}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <p className="text-sm text-slate-500">Interest paid</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {formatCurrency(currentLoan.interestPaid)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setActiveModal("schedule")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 transition"
                  >
                    <CalendarDays size={16} /> View Full Repayment Schedule
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 text-center">
                <ShieldCheck className="text-slate-400 mb-2" size={32} />
                <p className="text-slate-500 font-medium">
                  You have no active loans to display.
                </p>
              </div>
            )}
          </div>

          {/* Application Statuses */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ListChecks className="text-blue-700" size={20} />
              <h2 className="text-xl font-bold text-slate-950">
                Application Status
              </h2>
            </div>

            {applicationStatuses.length > 0 ? (
              <div className="mt-5 space-y-3">
                {applicationStatuses.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <StatusBadge status={item.label} />
                    <span className="font-bold text-slate-900">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500 text-center py-4">
                No recent applications found.
              </p>
            )}

            <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-900 border border-blue-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <p>
                  Applications move from pending review to approved, queued,
                  disbursed, rejected, or completed after officer processing.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Application Modal */}
      <Modal
        isOpen={activeModal === "application"}
        onClose={handleCloseModal}
        title="New Loan Application"
        icon={Plus}
        maxWidth="max-w-6xl"
      >
        <div className="grid gap-6 lg:grid-cols-5">
          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-6 lg:col-span-2 h-fit">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <ReceiptText className="text-blue-700" size={20} /> Pre-Submission
              Review
            </h3>

            <div className="mt-5 space-y-3">
              <PreviewRow
                icon={PiggyBank}
                label="Current saving balance"
                value={formatCurrency(memberSummary.savingBalance)}
              />
              <PreviewRow
                icon={Landmark}
                label="Current share balance"
                value={formatCurrency(memberSummary.shareBalance)}
              />
              <PreviewRow
                icon={Banknote}
                label="Existing loan balance"
                value={formatCurrency(memberSummary.existingLoanBalance)}
              />
              <PreviewRow
                icon={TrendingUp}
                label="Maximum allowable loan"
                value={formatCurrency(maximumLoanAmount)}
              />
              <PreviewRow
                icon={Clock3}
                label="Estimated monthly repayment"
                value={formatCurrency(estimatedMonthlyRepayment)}
              />
            </div>

            <div
              className={`mt-5 rounded-lg border p-4 shadow-sm ${
                eligibilityStatus
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {eligibilityStatus ? (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                ) : (
                  <XCircle className="mt-0.5 shrink-0" size={18} />
                )}
                <div>
                  <p className="font-bold">Eligibility status</p>
                  <p className="mt-1 text-sm">
                    {eligibilityStatus
                      ? "Eligible for submission based on the selected amount and repayment period."
                      : "Enter an amount within the allowable limit and repayment capacity."}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3"
          >
            <h3 className="text-lg font-bold text-slate-950">
              Application Form
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Complete all required fields before submitting your request.
            </p>

            {message.text && (
              <div
                className={`mt-5 flex items-start gap-2 rounded-lg border p-4 text-sm ${message.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
              >
                {message.type === "error" ? (
                  <XCircle className="mt-0.5 shrink-0" size={18} />
                ) : (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Loan Type
                </span>
                <select
                  required
                  name="loanTypeId" // Added name attribute for accessibility/form validation
                  id="loanTypeId" // Added id attribute
                  value={form.loanTypeId}
                  onChange={(e) => updateField("loanTypeId", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Select Loan Type
                  </option>
                  {loanTypes.length > 0 ? (
                    loanTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.interestRate}% Interest)
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading types...</option>
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Requested loan amount
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.requestedAmount}
                  onChange={(e) =>
                    updateField("requestedAmount", e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter amount"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Repayment period
                </span>
                <select
                  required
                  value={form.repaymentPeriod}
                  onChange={(e) =>
                    updateField("repaymentPeriod", e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Loan purpose
                </span>
                <input
                  type="text"
                  required
                  value={form.purpose}
                  onChange={(e) => updateField("purpose", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Business, education, home improvement..."
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Guarantor(s)
                </span>
                <textarea
                  required
                  rows="3"
                  value={form.guarantors}
                  onChange={(e) => updateField("guarantors", e.target.value)}
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter guarantor names, member IDs, or phone numbers"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Supporting documents
                </span>
                <div className="mt-2 flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:bg-slate-100 cursor-pointer">
                  <div>
                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                    <input
                      type="file"
                      onChange={(e) =>
                        updateField("documents", e.target.files?.[0] || null)
                      }
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Optional PDF, image, or document.
                    </p>
                  </div>
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Additional remarks
                </span>
                <textarea
                  rows="2"
                  value={form.remarks}
                  onChange={(e) => updateField("remarks", e.target.value)}
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Add any notes for the loan officer"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </Modal>

      {/* 2. Repayment Schedule Modal */}
      <Modal
        isOpen={activeModal === "schedule"}
        onClose={handleCloseModal}
        title="Repayment Schedule"
        icon={CalendarDays}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            Detailed breakdown of upcoming and completed installments.
          </p>
          <button
            type="button"
            onClick={() =>
              downloadCsv(repaymentSchedule, "repayment-schedule.csv")
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <Download size={16} /> Download CSV
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {repaymentSchedule.map((item) => (
                  <tr
                    key={item.no}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {item.no}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.dueDate}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(item.principal)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(item.interest)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(item.balance)}
                    </td>
                  </tr>
                ))}
                {repaymentSchedule.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-slate-500">
                      No repayment schedule available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 3. Loan History Modal */}
      <Modal
        isOpen={activeModal === "history"}
        onClose={handleCloseModal}
        title="Complete Loan History"
        icon={History}
        maxWidth="max-w-5xl"
      >
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Interest paid</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loanHistory.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">
                      {loan.id}
                    </td>
                    <td className="min-w-48 px-4 py-3 text-slate-600">
                      {loan.purpose}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatCurrency(loan.requestedAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {loan.repaymentPeriod} months
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatCurrency(loan.remainingBalance)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatCurrency(loan.interestPaid)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                  </tr>
                ))}
                {loanHistory.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-slate-500">
                      No loan history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default MyLoan;
