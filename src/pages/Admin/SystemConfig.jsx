import React, { useState } from "react";
import { Save, Building, Percent, Clock, Settings } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const SystemConfig = () => {
  const [config, setConfig] = useState({
    systemName: "University Saving, Share, Credit and Loan Management System",
    cooperativeInfo: "",
    minMonthlySaving: 500,
    minMonthlyShare: 100,
    shareUnitPrice: 1000,
    defaultLoanInterestRate: 5.5,
    maxLoanMultiplier: 6,
    latePaymentPenaltyPercent: 2,
    defaultRepaymentPeriod: 36,
    gracePeriodDays: 5,
    maxActiveLoansPerMember: 1,
    minMembershipDurationDays: 180,
    sessionTimeoutMinutes: 15,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/admin/config/update", config);
      toast.success("Policies updated successfully");
    } catch (err) {
      toast.error("Failed to update system policies", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          System Configuration
        </h1>

        {/* Financial Settings Section */}
        <Section title="Financial Parameters" icon={<Percent />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Min Monthly Saving"
              value={config.minMonthlySaving}
              onChange={(e) =>
                setConfig({ ...config, minMonthlySaving: e.target.value })
              }
            />
            <Input
              label="Share Unit Price"
              value={config.shareUnitPrice}
              onChange={(e) =>
                setConfig({ ...config, shareUnitPrice: e.target.value })
              }
            />
            <Input
              label="Loan Interest Rate (%)"
              value={config.defaultLoanInterestRate}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaultLoanInterestRate: e.target.value,
                })
              }
            />
            <Input
              label="Max Loan Multiplier"
              value={config.maxLoanMultiplier}
              onChange={(e) =>
                setConfig({ ...config, maxLoanMultiplier: e.target.value })
              }
            />
            <Input
              label="Penalty Percent (%)"
              value={config.latePaymentPenaltyPercent}
              onChange={(e) =>
                setConfig({
                  ...config,
                  latePaymentPenaltyPercent: e.target.value,
                })
              }
            />
          </div>
        </Section>

        {/* Operational Settings Section */}
        <Section title="Operational Rules" icon={<Clock />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Repayment Period (Months)"
              value={config.defaultRepaymentPeriod}
              onChange={(e) =>
                setConfig({ ...config, defaultRepaymentPeriod: e.target.value })
              }
            />
            <Input
              label="Grace Period (Days)"
              value={config.gracePeriodDays}
              onChange={(e) =>
                setConfig({ ...config, gracePeriodDays: e.target.value })
              }
            />
            <Input
              label="Min Membership (Days)"
              value={config.minMembershipDurationDays}
              onChange={(e) =>
                setConfig({
                  ...config,
                  minMembershipDurationDays: e.target.value,
                })
              }
            />
          </div>
        </Section>

        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
        >
          <Save size={20} /> Save Global Configuration
        </button>
      </div>
    </form>
  );
};

// Helper Components
const Section = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
    <div className="flex items-center gap-2 text-blue-600 mb-6 font-semibold uppercase tracking-wider text-sm">
      {icon} {title}
    </div>
    {children}
  </div>
);

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1">
      {label}
    </label>
    <input
      type="number"
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={onChange}
    />
  </div>
);

export default SystemConfig;
