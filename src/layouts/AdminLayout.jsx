import React, { useContext, useRef, useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";

const NAV_ITEMS = [
  { to: "/admin/dashboard", icon: "📈", label: "Dashboard" },
  { to: "/admin/campuses", icon: "🏢", label: "Campus Register" },
  { to: "/admin/register", icon: "👤", label: "Register Member" },
  { to: "/admin/users", icon: "👥", label: "Manage Users" },
  { to: "/admin/loans", icon: "💳", label: "Manage Loans" },
  { to: "/admin/savings", icon: "🏦", label: "Manage Savings" },
  { to: "/admin/payroll", icon: "💰", label: "Payroll Check" },
  { to: "/admin/ledger", icon: "🧾", label: "Ledger" },
  // { to: "/admin/attendance", icon: "📋", label: "Attendance" },
  { to: "/admin/reports", icon: "📊", label: "Reports" },
  { to: "/admin/system_config", icon: "⚙️", label: "System Config" },
];

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  // const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // This runs only on the initial mount
    return localStorage.getItem("theme") === "dark";
  });

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your session.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", // Tailwind red-500
      cancelButtonColor: "#3b82f6", // Tailwind blue-500
      confirmButtonText: "Yes, logout!",
      background: "#1e293b", // Tailwind slate-800
      color: "#f8fafc", // Tailwind slate-50
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/login", { replace: true });
      }
    });
  };

  // Close sidebar when clicking a link (mobile)
  const handleNavClick = () => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  // Close on resize back to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow =
      sidebarOpen && window.innerWidth <= 768 ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // useEffect(() => {
  //   const savedTheme = localStorage.getItem("theme");
  //   if (savedTheme === "dark") {
  //     setIsDarkMode(true);
  //     document.documentElement.classList.add("dark");
  //   }
  // }, []);
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const initials = user?.name ? user.name[0].toUpperCase() : "A";

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* ── Overlay (Mobile Only) ───────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ───────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shrink-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <img
              src="/Icon.jpg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 leading-tight">
              Saving and Loan
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Navigation
          </div>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
              onClick={handleNavClick}
            >
              <span className="text-lg w-5 text-center" aria-hidden="true">
                {icon}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group text-left"
            onClick={handleLogout}
            title="Click to logout"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500">
                  Logout
                </span>
                <span className="text-sm font-semibold text-slate-900 truncate max-w-[100px]">
                  {user?.name || "Admin"}
                </span>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            {/* Hamburger (Mobile) */}
            <button
              className="md:hidden p-2 -ml-2 mr-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? (
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
            <h1 className="text-xl font-bold text-slate-800 md:hidden">
              Dashboard
            </h1>
          </div>

          {/* User Profile Section - Right Corner */}

          {/* <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <span className="hidden sm:block text-sm font-medium text-slate-700">
                {user?.name || "Admin"}
              </span>
              <div
                className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0"
                aria-hidden="true"
              >
                {initials}
              </div>
            </div>
          </div> */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all text-slate-600"
              title="Toggle Theme"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <div className="relative" ref={dropdownRef}>
              {/* Trigger Button - Removed extra padding to make it more compact */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <span className="text-sm font-semibold text-slate-700 hidden sm:block">
                  {user?.name || "Admin"}
                </span>
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  {initials}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                /* Changed 'mt-2' to 'top-full pt-2' to eliminate the visible disconnect */
                <div className="absolute right-0 top-full pt-2 w-48 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 py-1 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user?.name}
                      </p>
                    </div>

                    <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      👤 Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      ⚙️ Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
