import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      const errs = [];
      const [usersRes, loansRes, savingsRes] = await Promise.allSettled([
        api.get("/admin/users"),
        api.get("/admin/loans"),
        api.get("/admin/savings"),
      ]);

      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data);
      else errs.push("Users failed to load.");

      if (loansRes.status === "fulfilled") setLoans(loansRes.value.data);
      else errs.push("Loans failed to load.");

      if (savingsRes.status === "fulfilled") setSavings(savingsRes.value.data);
      else errs.push("Savings failed to load.");

      setErrors(errs);
      setLoading(false);
    };
    fetchAdminDashboard();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  const totalLoans = loans.reduce((acc, l) => acc + (l.totalDisbursed || 0), 0);
  const totalRepayments = loans.reduce(
    (acc, l) => acc + (l.totalPrincipalRepaid || 0),
    0,
  );
  const totalCurrentBalance = loans.reduce(
    (acc, l) => acc + (l.totalOutstanding || 0),
    0,
  );
  const totalSavingsAmount = savings.reduce(
    (acc, s) => acc + (s.totalSavings || 0),
    0,
  );

  const stats = [
    {
      title: "Total Members",
      value: users.length,
      sub: "Registered users",
      color: "text-blue-600",
    },
    {
      title: "Savings Pool",
      value: `$${totalSavingsAmount.toLocaleString()}`,
      sub: `${savings.length} active savers`,
      color: "text-emerald-600",
    },
    {
      title: "Loans Disbursed",
      value: `$${totalLoans.toLocaleString()}`,
      sub: `Repaid: $${totalRepayments.toLocaleString()}`,
      color: "text-amber-600",
    },
    {
      title: "Outstanding",
      value: `$${totalCurrentBalance.toLocaleString()}`,
      sub: `${loans.length} active loans`,
      color: "text-rose-600",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Dashboard Overview
        </h2>
        <p className="text-slate-500">Welcome back, administrator.</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <p className="text-red-700 font-semibold">
            Errors encountered while loading data:
          </p>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <h3 className="text-slate-500 text-sm font-medium">{s.title}</h3>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              to: "/admin/member",
              label: "Manage Member",
              color: "bg-blue-600",
            },
            {
              to: "/admin/loans",
              label: "Loan Management",
              color: "bg-amber-500",
            },
            {
              to: "/admin/savings",
              label: "Savings Management",
              color: "bg-indigo-600",
            },
            {
              to: "/admin/attendance",
              label: "Mark Attendance",
              color: "bg-emerald-600",
            },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.to}
              className={`${action.color} text-white py-3 px-4 rounded-xl text-center font-medium hover:opacity-90 transition-opacity transform hover:scale-[1.02]`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Members Table */}
      {users.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="p-6 border-b border-slate-50 font-semibold text-lg">
            Recent Members
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.slice(0, 5).map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
