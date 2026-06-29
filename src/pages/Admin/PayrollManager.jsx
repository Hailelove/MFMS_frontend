import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

import api from "../../services/api";

const PayrollManager = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws);
      setData(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const uploadPayroll = async () => {
    if (!file) return toast.error("Please select a file");
    setLoading(true);
    try {
      await api.post("/payroll/upload", {
        payrollMonth: month,
        payrollYear: year,
        records: data,
      });
      toast.success("Payroll uploaded and verified successfully!");
    } catch (err) {
      toast.error("Failed to process payroll", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          Payroll Management
        </h1>

        {/* Upload Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="number"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="p-2 border rounded-lg"
              placeholder="Month"
            />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="p-2 border rounded-lg"
              placeholder="Year"
            />
            <input
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            onClick={uploadPayroll}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            {loading ? (
              <RefreshCw className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            Process & Verify Payroll
          </button>
        </div>

        {/* Preview Table */}
        {data.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 text-sm font-semibold">Employee ID</th>
                  <th className="p-4 text-sm font-semibold">Name</th>
                  <th className="p-4 text-sm font-semibold">Saving</th>
                  <th className="p-4 text-sm font-semibold">Share</th>
                  <th className="p-4 text-sm font-semibold">Net Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td className="p-4">{row.employeeId}</td>
                    <td className="p-4">{row.employeeName}</td>
                    <td className="p-4 text-emerald-600">
                      {row.savingDeduction}
                    </td>
                    <td className="p-4 text-blue-600">{row.shareDeduction}</td>
                    <td className="p-4 font-bold">{row.netSalary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollManager;
