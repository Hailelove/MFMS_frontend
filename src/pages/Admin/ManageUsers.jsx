import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import moment from "moment";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 10;

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "user",
    password: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      toast.error("Failed to load users: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await api.put(`/admin/users/${editUser._id}`, editForm);
      toast.success("User updated successfully");
      setUsers((prev) =>
        prev.map((u) => (u._id === editUser._id ? { ...u, ...res.data } : u)),
      );
      setEditUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Manage Users</h2>
        <div className="flex items-center gap-4">
          <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold">
            {users.length} Members
          </span>
          <AddUserButton
            onUserAdded={(newUser) => {
              setUsers([newUser, ...users]);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          No users found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Role
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Joined
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {moment(user.createdAt).format("MMM D, YYYY")}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-blue-600 hover:text-blue-800 font-medium px-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-800 font-medium px-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalItems={users.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className="w-full border rounded-lg p-2"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                type="password"
                className="w-full border rounded-lg p-2"
                placeholder="Leave blank to keep current"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm({ ...editForm, password: e.target.value })
                }
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="flex-1 bg-slate-100 py-2 rounded-lg font-medium hover:bg-slate-200"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
/* ─── Add User Button + Modal ─────────────────────────────────────── */
const AddUserButton = ({ onUserAdded }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setForm({ name: "", email: "", password: "", role: "user" });
    setShowPassword(false);
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/admin/users", form);
      toast.success(`User "${res.data.name}" created successfully!`);
      onUserAdded(res.data);
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
        onClick={() => setOpen(true)}
        id="add-user-btn"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        Add User
      </button>

      {open && (
        <Modal title="Add New User" onClose={handleClose}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="e.g. john@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                <option value="user">Member (User)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 border-l-4 border-blue-500 px-3 py-2 rounded-md">
              {form.role === "admin"
                ? "⚠️ Admin accounts have full access to the admin panel."
                : "👤 Members can log in and view their own data only."}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
                disabled={submitting}
                id="confirm-add-user-btn"
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
              <button
                type="button"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-all"
                onClick={handleClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

/* ─── Shared Modal Wrapper ────────────────────────────────────────── */
const Modal = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-200 relative max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
          aria-label="Close modal"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default ManageUsers;
