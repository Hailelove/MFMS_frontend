import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import moment from "moment";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 20;

const ManageMember = () => {
  const [campuses, setCampuses] = useState([]);
  const [staffTypes, setStaffTypes] = useState([]);

  const [filters, setFilters] = useState({
    campusId: "",
    staffTypeId: "",
    status: "",
    search: "",
  });

  const [users, setUsers] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);

  const [editUser, setEditUser] = useState(null);

  // Fully expanded form state matching all required schema fields
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    phone: "",
    campusId: "",
    staffTypeId: "",
    monthlySalary: "",
    initialSavingAmount: "",
    initialShareAmount: "",
    initialShareQuantity: "",
    maritalStatus: "",
    gender: "",
    age: "",
    nationalId: "",
    familySize: "",
    residentialAddress: "",
    woreda: "",
    kebele: "",
    employmentType: "",
    governmentOfficeName: "",
    dateOfEmployment: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    emergencyContactRel: "",
    status: "",
  });

  const [editLoading, setEditLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [campusRes, staffRes] = await Promise.all([
          api.get("/campuses"),
          api.get("/staff-types"),
        ]);
        setCampuses(campusRes.data || []);
        setStaffTypes(staffRes.data || []);
      } catch (err) {
        toast.error(
          "Failed to load filter options.",
          err.response?.data?.message || err.message,
        );
      }
    };
    fetchMeta();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/members", {
        params: { ...filters, page: currentPage, limit: ITEMS_PER_PAGE },
      });
      setUsers(response.data.members);
      setPaginationMeta(response.data.pagination);
    } catch (error) {
      toast.error(
        "Failed to load users: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [filters, currentPage]);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/members/${id}`);
      toast.success("User deleted successfully");
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const openEdit = (member) => {
    setEditUser(member);
    setEditForm({
      fullName: member.fullName || "",
      email: member.email || "",
      employeeId: member.employeeId || "",
      phone: member.phone || "",
      campusId: member.campusId || "",
      staffTypeId: member.staffTypeId || "",
      monthlySalary: member.monthlySalary || "",
      initialSavingAmount: member.initialSavingAmount || "",
      initialShareAmount: member.initialShareAmount || "",
      initialShareQuantity: member.initialShareQuantity || "",
      maritalStatus: member.maritalStatus || "",
      gender: member.gender || "",
      age: member.age || "",
      nationalId: member.nationalId || "",
      familySize: member.familySize || "",
      residentialAddress: member.residentialAddress || "",
      woreda: member.woreda || "",
      kebele: member.kebele || "",
      employmentType: member.employmentType || "",
      governmentOfficeName: member.governmentOfficeName || "",
      dateOfEmployment: member.dateOfEmployment
        ? moment(member.dateOfEmployment).format("YYYY-MM-DD")
        : "",
      emergencyContact: member.emergencyContact || "",
      emergencyContactPhone: member.emergencyContactPhone || "",
      emergencyContactRel: member.emergencyContactRel || "",
      status: member.status || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    // Explicit type transformations for numeric database records
    const payload = {
      ...editForm,
      campusId: Number(editForm.campusId),
      staffTypeId: Number(editForm.staffTypeId),
      monthlySalary: Number(editForm.monthlySalary),
      initialSavingAmount: Number(editForm.initialSavingAmount),
      initialShareAmount: Number(editForm.initialShareAmount),
      initialShareQuantity: Number(editForm.initialShareQuantity),
      age: Number(editForm.age),
      familySize: Number(editForm.familySize),
    };

    try {
      await api.put(`/members/${editUser.id}`, payload);
      toast.success("Member profile updated successfully");
      setEditUser(null);
      fetchMembers();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update member configuration.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Manage Members</h2>
        <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold">
          {paginationMeta.total} Members Registered
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Advanced Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search Name, ID, Phone, Email..."
            className="border border-slate-300 px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-72"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />

          <select
            className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={filters.campusId}
            onChange={(e) => handleFilterChange("campusId", e.target.value)}
          >
            <option value="">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={filters.staffTypeId}
            onChange={(e) => handleFilterChange("staffTypeId", e.target.value)}
          >
            <option value="">All Staff Types</option>
            {staffTypes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* Dynamic Table Layout */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              No members found matching your search.
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Membership No
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Employee ID / ID
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Phone
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Campus
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Employment Type
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {member.membershipNo}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {member.employeeId || member.nationalId || "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {member.fullName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{member.phone}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {member.campus?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {member.employmentType || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          member.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : member.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-3 justify-end items-center">
                      <button
                        onClick={() => openEdit(member)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && paginationMeta.total > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <Pagination
              currentPage={currentPage}
              totalItems={paginationMeta.total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Expanded Edit Modal Layout */}
      {editUser && (
        <Modal
          title="Complete Profile Management"
          onClose={() => setEditUser(null)}
        >
          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* SECTION 1: Personal Specifications */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                1. Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Full Name
                  </label>
                  <input
                    required
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.fullName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Phone
                  </label>
                  <input
                    required
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    National ID Card No.
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.nationalId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nationalId: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Age
                  </label>
                  <input
                    type="number"
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.age}
                    onChange={(e) =>
                      setEditForm({ ...editForm, age: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Gender
                  </label>
                  <select
                    className="border p-2 rounded-lg text-sm bg-white"
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value })
                    }
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Marital Status
                  </label>
                  <select
                    className="border p-2 rounded-lg text-sm bg-white"
                    value={editForm.maritalStatus}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maritalStatus: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Family Size
                  </label>
                  <input
                    type="number"
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.familySize}
                    onChange={(e) =>
                      setEditForm({ ...editForm, familySize: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Address Profile */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                2. Residential Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Street / Residential Address
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.residentialAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        residentialAddress: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Woreda
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.woreda}
                    onChange={(e) =>
                      setEditForm({ ...editForm, woreda: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Kebele
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.kebele}
                    onChange={(e) =>
                      setEditForm({ ...editForm, kebele: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Organization & Institutional Structure */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                3. Employment & Institutional Reference
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Employee ID
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.employeeId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, employeeId: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Campus Assignment
                  </label>
                  <select
                    required
                    className="border p-2 rounded-lg text-sm bg-white"
                    value={editForm.campusId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, campusId: e.target.value })
                    }
                  >
                    <option value="">Select Campus</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Staff Classification
                  </label>
                  <select
                    required
                    className="border p-2 rounded-lg text-sm bg-white"
                    value={editForm.staffTypeId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, staffTypeId: e.target.value })
                    }
                  >
                    <option value="">Select Classification</option>
                    {staffTypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Employment Type Designation
                  </label>
                  <select
                    className="border p-2 rounded-lg text-sm bg-white"
                    value={editForm.employmentType}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        employmentType: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Type</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Government External">
                      Government External
                    </option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Government Office Name (If applicable)
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.governmentOfficeName}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        governmentOfficeName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Date of Official Employment
                  </label>
                  <input
                    type="date"
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.dateOfEmployment}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        dateOfEmployment: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Financial Foundations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                4. Financial Parameters
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Monthly Gross Salary
                  </label>
                  <input
                    type="number"
                    required
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.monthlySalary}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        monthlySalary: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Initial Deposit Amount
                  </label>
                  <input
                    type="number"
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.initialSavingAmount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        initialSavingAmount: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Initial Share Value (ETB)
                  </label>
                  <input
                    type="number"
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.initialShareAmount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        initialShareAmount: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Initial Share Count
                  </label>
                  <input
                    type="number"
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.initialShareQuantity}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        initialShareQuantity: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: Emergency Protocols */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                5. Emergency Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Contact Full Name
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.emergencyContact}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContact: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Contact Telephone Phone
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    value={editForm.emergencyContactPhone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Relationship Type
                  </label>
                  <input
                    className="border p-2 rounded-lg text-sm"
                    placeholder="e.g. Spouse, Parent"
                    value={editForm.emergencyContactRel}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContactRel: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: Account Access Status */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                6. Operational Status
              </h4>
              <div className="w-full md:w-1/3 flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Member Lifecycle Status
                </label>
                <select
                  required
                  className="border p-2 rounded-lg text-sm bg-white"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={editLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm"
              >
                {editLoading
                  ? "Updating Configurations..."
                  : "Save Member Profile"}
              </button>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-all"
              >
                Dismiss Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

/* ─── Shared Modal Structural Wrapper ────────────────────────────────────────── */
const Modal = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-5xl shadow-2xl relative max-h-[92vh] overflow-y-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="3" />
            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="3" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default ManageMember;
