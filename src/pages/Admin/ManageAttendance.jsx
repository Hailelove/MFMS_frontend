import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import moment from "moment";
import Pagination from "../../components/Pagination";

const STATUS_OPTIONS = ["present", "absent", "late", "leave"];
const STATUS_LABELS = {
  present: "✓ Present",
  absent: "✗ Absent",
  late: "⏰ Late",
  leave: "🌿 Leave",
};
const STATUS_COLORS = {
  present: { bg: "#dcfce7", color: "#166534" },
  absent: { bg: "#fee2e2", color: "#991b1b" },
  late: { bg: "#fef3c7", color: "#92400e" },
  leave: { bg: "#e0e7ff", color: "#3730a3" },
};

const ITEMS_PER_PAGE = 12;

const ManageAttendance = () => {
  const [activeTab, setActiveTab] = useState("mark");

  // ─── Mark tab state ───────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const [records, setRecords] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─── Monthly + Fines tab state ────────────────────────────────────────────────
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // ─── Fine form state ──────────────────────────────────────────────────────────
  const [fineUserId, setFineUserId] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [finePaidOn, setFinePaidOn] = useState(moment().format("YYYY-MM-DD"));
  const [fineNote, setFineNote] = useState("");
  const [submittingFine, setSubmittingFine] = useState(false);

  // ─── Pagination state ─────────────────────────────────────────────────────────
  const [markPage, setMarkPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [finesPage, setFinesPage] = useState(1);

  // ─── Fetch users ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/admin/users");
      const memberUsers = res.data; // already filtered to role: "user" by backend
      setUsers(memberUsers);
      // Initialise records object
      const init = {};
      memberUsers.forEach((u) => {
        init[u._id] = { status: "present", note: "" };
      });
      setRecords(init);
    } catch (err) {
      toast.error(
        "Failed to load users: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // ─── Fetch monthly report ─────────────────────────────────────────────────────
  const fetchMonthlyReport = useCallback(async (m, y) => {
    setLoadingReport(true);
    setMonthlyReport([]);
    try {
      const res = await api.get(
        `/admin/attendance/monthly?month=${m}&year=${y}`,
      );
      setMonthlyReport(res.data.summary || []);
    } catch (err) {
      toast.error(
        "Failed to load monthly report: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setLoadingReport(false);
    }
  }, []);

  // ─── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "mark") {
      fetchUsers();
    } else {
      fetchMonthlyReport(month, year);
      if (activeTab === "fines" && users.length === 0) fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Refresh monthly report when month/year changes (only on those tabs)
  useEffect(() => {
    if (activeTab === "monthly" || activeTab === "fines") {
      fetchMonthlyReport(month, year);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  // ─── Attendance handlers ──────────────────────────────────────────────────────
  const handleStatusChange = (userId, status) => {
    setRecords((prev) => ({ ...prev, [userId]: { ...prev[userId], status } }));
  };
  const handleNoteChange = (userId, note) => {
    setRecords((prev) => ({ ...prev, [userId]: { ...prev[userId], note } }));
  };

  const submitAttendance = async () => {
    if (users.length === 0) {
      toast.warn("No users to mark attendance for.");
      return;
    }
    setSubmitting(true);
    try {
      const formattedRecords = users.map((u) => ({
        userId: u._id,
        status: records[u._id]?.status || "present",
        note: records[u._id]?.note || "",
      }));

      await api.post("/admin/attendance", {
        attendanceDate: moment(attendanceDate).toISOString(),
        weekStartDay: 1, // 1 = Monday
        records: formattedRecords,
      });
      toast.success("Attendance marked successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── CSV Download ─────────────────────────────────────────────────────────────
  const downloadCSV = () => {
    const token = localStorage.getItem("token");
    const base =
      import.meta.env.VITE_API_URL ||
      "https://microfinance-u92z.onrender.com/api";
    window.open(
      `${base}/admin/attendance/download?month=${month}&year=${year}&token=${token}`,
      "_blank",
    );
  };

  // ─── Fine submit ──────────────────────────────────────────────────────────────
  const submitFine = async (e) => {
    e.preventDefault();
    if (!fineUserId) {
      toast.warn("Please select a user");
      return;
    }
    if (!fineAmount || Number(fineAmount) < 1) {
      toast.warn("Enter a valid amount");
      return;
    }

    setSubmittingFine(true);
    try {
      await api.post("/admin/attendance/fine/payment", {
        userId: fineUserId,
        amount: parseFloat(fineAmount),
        month: parseInt(month),
        year: parseInt(year),
        paidOn: moment(finePaidOn).toISOString(),
        note: fineNote,
      });
      toast.success("Fine payment recorded");
      setFineAmount("");
      setFineNote("");
      setFineUserId("");
      fetchMonthlyReport(month, year);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to record fine payment",
      );
    } finally {
      setSubmittingFine(false);
    }
  };

  // Paginated slices
  const paginatedUsers = users.slice(
    (markPage - 1) * ITEMS_PER_PAGE,
    markPage * ITEMS_PER_PAGE,
  );
  const paginatedMonthly = monthlyReport.slice(
    (monthlyPage - 1) * ITEMS_PER_PAGE,
    monthlyPage * ITEMS_PER_PAGE,
  );
  const finesData = monthlyReport.filter(
    (r) => r.fineOwed > 0 || r.totalPaid > 0,
  );
  const paginatedFines = finesData.slice(
    (finesPage - 1) * ITEMS_PER_PAGE,
    finesPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen text-slate-800 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
      {/* Dynamic Tab Bar Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Attendance Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Registry logs, dynamic monthly analytics, and automated fine
            auditing layers.
          </p>
        </div>

        {/* Navigation Tab Group */}
        <div className="flex flex-wrap gap-2 bg-slate-100/80 p-1.5 rounded-xl self-start sm:self-auto border border-slate-200/60">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === "mark"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/40"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("mark")}
          >
            <span>📋</span> <span>Mark Weekly</span>
          </button>

          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === "monthly"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/40"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("monthly")}
          >
            <span>📅</span> <span>Monthly Report</span>
          </button>

          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === "fines"
                ? "bg-red-600 text-white shadow-md shadow-red-100"
                : "text-slate-600 hover:text-red-600 hover:bg-red-50/50"
            }`}
            onClick={() => setActiveTab("fines")}
          >
            <span>💸</span> <span>Manage Fines</span>
          </button>
        </div>
      </div>

      {/* ─── MARK WEEKLY ATTENDANCE TAB ──────────────────────────────────────────────────────────── */}
      {activeTab === "mark" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/50 p-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Mark Weekly Attendance
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                System uses the selected date to determine the active week
                pipeline.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                Meeting Date:
              </label>
              <input
                type="date"
                className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6">
            {loadingUsers ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">
                  No members found. Register users first within the central
                  database.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4 w-16">#</th>
                        <th className="px-6 py-4">Member Name</th>
                        <th className="px-6 py-4 w-1/2">
                          Status Configuration
                        </th>
                        <th className="px-6 py-4">System Trace Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedUsers.map((user, idx) => (
                        <tr
                          key={user._id}
                          className="hover:bg-slate-50/40 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 font-mono text-slate-400">
                            {(markPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {STATUS_OPTIONS.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(user._id, s)
                                  }
                                  className="px-3 py-1.5 border-2 rounded-lg text-xs font-bold transition-all duration-200 transform active:scale-95 cursor-pointer"
                                  style={{
                                    borderColor:
                                      records[user._id]?.status === s
                                        ? STATUS_COLORS[s].color
                                        : "#cbd5e1",
                                    background:
                                      records[user._id]?.status === s
                                        ? STATUS_COLORS[s].bg
                                        : "transparent",
                                    color:
                                      records[user._id]?.status === s
                                        ? STATUS_COLORS[s].color
                                        : "#94a3b8",
                                  }}
                                >
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-50/50 transition-all"
                              placeholder="Optional ledger note"
                              value={records[user._id]?.note || ""}
                              onChange={(e) =>
                                handleNoteChange(user._id, e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 pt-4">
                  <Pagination
                    currentPage={markPage}
                    totalItems={users.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setMarkPage}
                  />
                  <div className="text-right">
                    <button
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all transform hover:scale-[1.01] shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={submitAttendance}
                      disabled={submitting}
                    >
                      {submitting
                        ? "Saving Matrix..."
                        : `✓ Save Attendance for ${moment(attendanceDate).format("MMM Do YYYY")}`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── MONTHLY REPORT ANALYSIS TAB ──────────────────────────────────────────────────── */}
      {activeTab === "monthly" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/50 p-6 gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={month}
                onChange={(e) => {
                  setMonth(Number(e.target.value));
                  setMonthlyPage(1);
                }}
                className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {moment()
                      .month(m - 1)
                      .format("MMMM")}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setMonthlyPage(1);
                }}
                className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-800 font-mono w-24 text-center focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
              ></input>
            </div>

            <button
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-slate-100 flex items-center space-x-1.5 self-start sm:self-auto"
              onClick={downloadCSV}
            >
              <span>⬇</span> <span>Download CSV Report</span>
            </button>
          </div>

          <div className="p-6">
            {loadingReport ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
              </div>
            ) : monthlyReport.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 text-sm">
                  No certified attendance records validated for{" "}
                  {moment()
                    .month(month - 1)
                    .format("MMMM")}{" "}
                  {year}.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Member Workspace</th>
                        <th className="px-6 py-4">Weeks</th>
                        <th className="px-6 py-4">Present</th>
                        <th className="px-6 py-4">Absent</th>
                        <th className="px-6 py-4">Late / Leave</th>
                        <th className="px-6 py-4">Fine Owed</th>
                        <th className="px-6 py-4">Fine Paid</th>
                        <th className="px-6 py-4">Balance Matrix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedMonthly.map((r) => (
                        <tr
                          key={r.userId}
                          className="hover:bg-slate-50/40 transition-colors duration-150"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">
                              {r.name}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {r.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            {r.totalWeeks}
                          </td>
                          <td className="px-6 py-4 text-emerald-600 font-bold font-mono">
                            {r.present}
                          </td>
                          <td
                            className={`px-6 py-4 font-mono ${r.absent > 0 ? "text-red-600 font-bold" : "text-slate-500"}`}
                          >
                            {r.absent}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium font-mono">
                            {r.late} / {r.leave}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700">
                            ₹{(r.fineOwed || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 font-mono text-blue-600 font-medium">
                            ₹{(r.totalPaid || 0).toFixed(2)}
                          </td>
                          <td
                            className={`px-6 py-4 font-bold font-mono ${r.balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                          >
                            ₹{(r.balance || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={monthlyPage}
                  totalItems={monthlyReport.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setMonthlyPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── FINES MANAGEMENT WORKSPACE SPLIT LAYOUT TAB ───────────────────────────────────────────────────────────── */}
      {activeTab === "fines" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
          {/* Form Side Block Panel */}
          <div className="lg:col-span-1 bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3">
                Record Fine Payment
              </h3>
            </div>

            <form onSubmit={submitFine} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                    Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => {
                      setMonth(Number(e.target.value));
                      setFinesPage(1);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-red-500 transition-all shadow-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {moment()
                          .month(m - 1)
                          .format("MMMM")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => {
                      setYear(Number(e.target.value));
                      setFinesPage(1);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-mono text-center focus:outline-none focus:border-red-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                  Select Member *
                </label>
                <select
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-red-500 transition-all shadow-sm"
                  value={fineUserId}
                  onChange={(e) => setFineUserId(e.target.value)}
                  required
                >
                  <option value="">— Choose Member —</option>
                  {(monthlyReport.length > 0
                    ? monthlyReport
                    : users.map((u) => ({
                        userId: u._id,
                        name: u.name,
                        balance: null,
                      }))
                  ).map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.name}{" "}
                      {u.balance != null
                        ? ` (Bal: ₹${u.balance.toFixed(2)})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  placeholder="e.g. 20"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                  Paid On *
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  value={finePaidOn}
                  onChange={(e) => setFinePaidOn(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                  Note Context
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  placeholder="e.g. Paid cash at meeting"
                  value={fineNote}
                  onChange={(e) => setFineNote(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all transform hover:scale-[1.01] shadow-md shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed pt-2"
                disabled={submittingFine}
              >
                {submittingFine
                  ? "Recording Entry..."
                  : "💸 Record Fine Payment"}
              </button>
            </form>
          </div>

          {/* Table Summary Side Block Panel */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-3">
                Fine Summary —{" "}
                {moment()
                  .month(month - 1)
                  .format("MMMM")}{" "}
                {year}
              </h3>
            </div>

            {loadingReport ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin"></div>
              </div>
            ) : finesData.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">
                  No fine data available for this month. Mark attendance to
                  generate fines automatically.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Member Identity</th>
                        <th className="px-6 py-4">Fine Owed</th>
                        <th className="px-6 py-4">Total Paid</th>
                        <th className="px-6 py-4">Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedFines.map((r) => (
                        <tr
                          key={r.userId}
                          className="hover:bg-slate-50/40 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {r.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700">
                            ₹{(r.fineOwed || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 font-mono text-blue-600 font-medium">
                            ₹{(r.totalPaid || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg font-mono border ${
                                r.balance > 0
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              ₹{(r.balance || 0).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={finesPage}
                  totalItems={finesData.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setFinesPage}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAttendance;
