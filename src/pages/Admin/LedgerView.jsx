import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { ShieldCheck, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

const LedgerView = () => {
  const [activeLedger, setActiveLedger] = useState("UNION"); // UNION or BANK
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [activeLedger]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ledgers?type=${activeLedger}`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Financial Ledger
          </h1>
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {["UNION", "BANK"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveLedger(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${activeLedger === type ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {type} Ledger
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-slate-700">Date</th>
                <th className="p-4 font-semibold text-slate-700">Category</th>
                <th className="p-4 font-semibold text-slate-700">Type</th>
                <th className="p-4 font-semibold text-slate-700 text-right">
                  Amount
                </th>
                <th className="p-4 font-semibold text-slate-700 text-right">
                  Running Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-600 font-mono">
                    {new Date(tx.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-medium text-slate-900">
                    {tx.category}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.transactionType === "DEPOSIT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                    >
                      {tx.transactionType}
                    </span>
                  </td>
                  <td
                    className={`p-4 text-right font-bold ${tx.transactionType === "DEPOSIT" ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {tx.transactionType === "DEPOSIT" ? "+" : "-"}
                    {Number(tx.amount).toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-mono font-semibold">
                    {Number(tx.balance).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LedgerView;
