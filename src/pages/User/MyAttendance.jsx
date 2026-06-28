import React, { useEffect, useState } from "react";
import api from "../../services/api";
import moment from "moment";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 10;

const MyAttendance = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [weeklyPage, setWeeklyPage] = useState(1);
  const [finePage, setFinePage] = useState(1);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/users/attendance/me?month=${month}&year=${year}`,
      );
      setAttendanceData(response.data);
      setError(null);
      setWeeklyPage(1);
      setFinePage(1);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch attendance information",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const handleMonthChange = (e) => setMonth(e.target.value);
  const handleYearChange = (e) => setYear(e.target.value);

  const weeklyRecords = attendanceData?.weeklyRecords || [];
  const finePayments = attendanceData?.finePayments || [];

  const paginatedWeekly = weeklyRecords.slice(
    (weeklyPage - 1) * ITEMS_PER_PAGE,
    weeklyPage * ITEMS_PER_PAGE,
  );
  const paginatedFines = finePayments.slice(
    (finePage - 1) * ITEMS_PER_PAGE,
    finePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          My Attendance
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={handleMonthChange}
            className="rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            onChange={handleYearChange}
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            min="2020"
            max="2100"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="animate-spin rounded-full h-9 w-9 border-3 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">
            Loading records...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 shadow-sm">
          {error}
        </div>
      ) : !attendanceData ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
          No attendance data available for this month.
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Present Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                Present
              </div>
              <div className="mt-2 text-3xl font-bold text-emerald-600">
                {attendanceData.present}
              </div>
            </div>

            {/* Absent Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                Absent
              </div>
              <div
                className={`mt-2 text-3xl font-bold ${attendanceData.absent > 0 ? "text-rose-600" : "text-slate-900"}`}
              >
                {attendanceData.absent}
              </div>
            </div>

            {/* Late / Leave Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                Late / Leave
              </div>
              <div className="mt-2 text-3xl font-bold text-amber-500">
                {attendanceData.late}{" "}
                <span className="text-slate-300 font-light text-2xl">/</span>{" "}
                {attendanceData.leave}
              </div>
            </div>

            {/* Fine Balance Card */}
            <div
              className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${attendanceData.fineBalance > 0 ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200"}`}
            >
              <div
                className={`text-xs font-semibold tracking-wider uppercase ${attendanceData.fineBalance > 0 ? "text-rose-800" : "text-slate-500"}`}
              >
                Fine Balance
              </div>
              <div
                className={`mt-2 text-3xl font-bold ${attendanceData.fineBalance > 0 ? "text-rose-600" : "text-slate-900"}`}
              >
                $ {attendanceData.fineBalance?.toFixed(2) || "0.00"}
              </div>
            </div>
          </div>

          {/* Weekly Attendance Records Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-800">
                Weekly Attendance Records
              </h3>
            </div>
            {weeklyRecords.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-3">Week Start Date</th>
                        <th className="px-6 py-3">Attendance Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedWeekly.map((record, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {moment(record.weekStartDate).format(
                              "MMMM Do YYYY",
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {moment(record.attendanceDate).format(
                              "MMMM Do YYYY",
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                                record.status === "present"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : record.status === "absent"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : record.status === "late"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-sky-50 text-sky-700 border-sky-200"
                              }`}
                            >
                              {record.status.charAt(0).toUpperCase() +
                                record.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                            {record.note || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                  <Pagination
                    currentPage={weeklyPage}
                    totalItems={weeklyRecords.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setWeeklyPage}
                  />
                </div>
              </>
            ) : (
              <p className="px-6 py-6 text-sm text-slate-500">
                No weekly records found.
              </p>
            )}
          </div>

          {/* Fine Payments Table */}
          {finePayments.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-base font-bold text-slate-800">
                  Fine Payments
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">Paid On</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedFines.map((payment, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {moment(payment.paidOn).format("MMMM Do YYYY h:mm A")}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                          $ {payment.amount}
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
                  currentPage={finePage}
                  totalItems={finePayments.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setFinePage}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyAttendance;
