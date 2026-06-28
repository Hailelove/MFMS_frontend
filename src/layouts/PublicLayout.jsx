import React from "react";
import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
      {/* ── Left decorative panel (Hidden on mobile, visible on large screens) ──────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden p-12 xl:p-20 items-center justify-center shadow-[inset_-10px_0_30px_rgba(0,0,0,0.1)]">
        {/* Ambient Blurred Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-50 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500 rounded-full mix-blend-overlay filter blur-[120px] opacity-20" />

        {/* Content Wrapper */}
        <div className="relative z-10 w-full max-w-lg flex flex-col justify-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <img
                src="/Icon.jpg"
                alt="MicroFinance Logo"
                className="w-10 h-10 object-contain"
                aria-hidden="true"
              />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">
              MicroFinance
            </span>
          </div>

          {/* Tagline */}
          <p className="text-xl font-medium text-blue-100 leading-relaxed mb-12">
            Empowering communities through transparent savings, loans, and
            financial inclusion.
          </p>

          {/* Interactive Feature Cards */}
          <div className="space-y-4">
            <div className="group flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default">
              <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 group-hover:bg-blue-500/50 transition-all duration-300">
                <span className="text-xl leading-none block">💳</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  Real-time Tracking
                </h3>
                <p className="text-sm text-blue-200">
                  Track loans, repayments & interest securely and accurately.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default">
              <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 group-hover:bg-purple-500/50 transition-all duration-300">
                <span className="text-xl leading-none block">🏦</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Smart Savings</h3>
                <p className="text-sm text-blue-200">
                  Weekly savings ledger with automated 1% monthly interest.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default">
              <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 group-hover:bg-cyan-500/50 transition-all duration-300">
                <span className="text-xl leading-none block">📋</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  Automated Attendance
                </h3>
                <p className="text-sm text-blue-200">
                  Seamless attendance tracking with a built-in fine system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel (Visible on all screens) ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Logo Header (Only visible on smaller screens) */}
        <div className="lg:hidden flex items-center gap-2 absolute top-8">
          <img
            src="/Icon.jpg"
            alt="MicroFinance"
            className="w-8 h-8 object-contain"
            aria-hidden="true"
          />
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            MicroFinance
          </span>
        </div>

        {/* Dynamic Auth Form Container */}
        <div className="w-full max-w-md mt-16 lg:mt-0 z-10 relative">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="absolute bottom-8 text-xs text-slate-500 text-center font-medium">
          © {new Date().getFullYear()} MicroFinance Management System
        </p>
      </div>
    </div>
  );
};

export default PublicLayout;
