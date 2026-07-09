import React, { useContext, useRef, useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import Settings from "../pages/Settings";

const UserLayout = () => {
  const { t } = useTranslation("layout", "common");

  const NAV_ITEMS = [
    { to: "/dashboard", icon: "📈", label: t("nav.Dashboard") },
    { to: "/my-savings", icon: "🏦", label: t("nav.My Savings") },
    { to: "/my-loans", icon: "💳", label: t("nav.My Loans") },
    { to: "/my-attendance", icon: "📋", label: t("nav.Attendance") },
  ];

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSetting = () => {
    setIsDropdownOpen(false);
    navigate("/settings");
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your session.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Yes, logout!",
      background: "#1e293b",
      color: "#f8fafc",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/login", { replace: true });
      }
    });
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // This runs only on the initial mount
    return localStorage.getItem("theme") === "dark";
  });

  // Logic for mobile responsiveness
  const handleNavClick = () => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const initials = user?.name ? user.name[0].toUpperCase() : "M";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}

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
              Member Panel
            </span>
          </div>
        </div>

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
                  {t("Logout", { ns: "common" })}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 transition"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>

            {/* <h1 className="text-xl font-bold text-slate-800">Dashboard</h1> */}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Language */}
            <div className="flex items-center  px-3 py-2 hover:bg-slate-50 transition">
              {" "}
              {/* border rounded-lg */}
              <LanguageSwitcher />
            </div>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition"
              title="Toggle Theme"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* User */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-slate-100 transition"
              >
                <span className="hidden md:block text-sm font-medium text-slate-700">
                  {user?.name || "Admin"}
                </span>

                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {initials}
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-xs text-slate-500">Signed in as</p>

                    <p className="font-semibold truncate">{user?.name}</p>
                  </div>

                  <button className="w-full px-4 py-3 text-left hover:bg-slate-50">
                    👤 {t("Profile", { ns: "common" })}
                  </button>

                  <button
                    onClick={handleSetting}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50"
                  >
                    ⚙️ {t("Settings", { ns: "common" })}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50"
                  >
                    🚪 {t("Logout", { ns: "common" })}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
