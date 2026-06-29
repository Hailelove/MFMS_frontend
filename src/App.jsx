import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Providers
import { AuthProvider } from "./context/AuthContext";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

// Route Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import GuestRoute from "./routes/GuestRoute"; // ← new: blocks login/register when logged in

// Pages - Public
import Login from "./pages/Public/Login";

// Pages - User
import UserDashboard from "./pages/User/Dashboard";
import MyLoans from "./pages/User/MyLoans";
import MySavings from "./pages/User/MySavings";
import MyAttendance from "./pages/User/MyAttendance";

// Pages - Admin
import AdminDashboard from "./pages/Admin/Dashboard";
import ManageUsers from "./pages/Admin/ManageUsers";
import ManageLoans from "./pages/Admin/ManageLoans";
import ManageSavings from "./pages/Admin/ManageSavings";
// import ManageAttendance from "./pages/Admin/ManageAttendance";
import ManageReports from "./pages/Admin/ManageReports";
import RegisterMember from "./pages/Admin/RegisterMember";
import CampusRegistration from "./pages/Admin/CampusRegistration";
import PayrollManager from "./pages/Admin/PayrollManager";
import LedgerView from "./pages/Admin/LedgerView";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />
        <Routes>
          {/* ── Public / Guest Routes ─────────────────────────────────────────
              GuestRoute prevents logged-in users from seeing login/register.
              If already authenticated, they are redirected to their dashboard.
          ─────────────────────────────────────────────────────────────────── */}
          <Route element={<GuestRoute />}>
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>
          </Route>

          {/* Root redirect: go to login for guests, dashboard for logged-in */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── User Protected Routes ──────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<UserLayout />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/my-loans" element={<MyLoans />} />
              <Route path="/my-savings" element={<MySavings />} />
              <Route path="/my-attendance" element={<MyAttendance />} />
            </Route>
          </Route>

          {/* ── Admin Protected Routes ─────────────────────────────────────── */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="register" element={<RegisterMember />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="loans" element={<ManageLoans />} />
              <Route path="savings" element={<ManageSavings />} />
              {/* <Route path="attendance" element={<ManageAttendance />} /> */}
              <Route path="reports" element={<ManageReports />} />
              <Route path="campuses" element={<CampusRegistration />} />
              <Route path="payroll" element={<PayrollManager />} />
              <Route path="ledger" element={<LedgerView />} />
            </Route>
          </Route>

          {/* ── 404 ────────────────────────────────────────────────────────── */}
          <Route
            path="*"
            element={
              <div style={{ padding: "5rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "4rem", color: "#e2e8f0" }}>404</h2>
                <p style={{ color: "#64748b" }}>Page not found.</p>
                <a href="/login" style={{ color: "var(--primary-color)" }}>
                  Go to Login
                </a>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
