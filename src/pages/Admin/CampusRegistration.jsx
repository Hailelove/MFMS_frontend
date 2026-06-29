import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import api from "../../services/api";

const defaultValues = {
  name: "",
  code: "",
  location: "",
  status: true,
  description: "",
};

const staffDefaultValues = {
  staffTypeId: "",
  campusId: "",
};

const CampusRegistration = () => {
  const [campuses, setCampuses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isStaffSubmitting, setIsStaffSubmitting] = useState(false);

  const [editStaffType, setEditStaffType] = useState(null);
  const [editName, setEditName] = useState("");

  const openEditStaffType = (type) => {
    setEditStaffType(type);
    setEditName(type.name);
  };

  const closeEditStaffType = () => {
    setEditStaffType(null);
    setEditName("");
  };

  const [staffTypes, setStaffTypes] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  // Fetch existing types
  const fetchStaffTypes = async () => {
    try {
      const res = await api.get("/campuses/staff-types"); // Ensure this endpoint exists
      setStaffTypes(res.data);
    } catch (err) {
      toast.error("Failed to load staff types", err);
    }
  };

  const updateStaffType = async () => {
    if (!editName || !editName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const res = await api.put(`/campuses/staff-types/${editStaffType.id}`, {
        name: editName.trim(),
      });

      // const updated = res.data;

      // UPDATE LOCAL STATE
      setStaffTypes((prev) =>
        prev.map((item) => (item.id === res.data.id ? res.data : item)),
      );

      toast.success("Staff type updated successfully!");
      closeEditStaffType();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const deleteStaffType = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this staff type?",
    );
    if (!confirmed) return;

    try {
      // Make sure your backend route exists: DELETE /api/staff-types/:id
      await api.delete(`/campuses/staff-types/${id}`);
      setStaffTypes((prev) => prev.filter((item) => item.id !== id));
      toast.success("Deleted successfully!");
    } catch (err) {
      // This will catch the 'Restrict' error if staff are still using this type
      fetchStaffTypes(); // rollback refresh
      toast.error(
        err.response?.data?.message ||
          "Cannot delete: Staff are assigned to this type.",
      );
    }
  };

  const {
    register: registerStaff,
    handleSubmit: handleStaffSubmit,
    reset: resetStaff,
    formState: { errors: staffErrors },
  } = useForm({
    defaultValues: staffDefaultValues,
  });
  const openCreateStaffModal = () => {
    // resetStaff(staffDefaultValues);
    // setIsStaffModalOpen(true);
    setViewMode("list");
    setIsStaffModalOpen(true);
    fetchStaffTypes();
  };

  const closeStaffModal = () => {
    setIsStaffModalOpen(false);
    resetStaff(staffDefaultValues);
  };

  const onSubmitStaff = async (data) => {
    setIsStaffSubmitting(true);

    try {
      // STEP 1: create staff type (IMPORTANT FIX HERE)
      const res = await api.post("/campuses/staff-types", {
        name: data.staffTypeName.trim(), // 🔥 MUST be "name"
      });

      const staffTypeId = res.data.id;

      // STEP 2: assign to campus
      await api.post("/campuses/campus-staff-types", {
        campusId: Number(data.campusId),
        staffTypeId: staffTypeId,
      });

      toast.success("Staff type created and assigned successfully!");

      closeStaffModal();
      fetchCampuses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register staff");
    } finally {
      setIsStaffSubmitting(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const fetchCampuses = async () => {
    try {
      const res = await api.get("/campuses");
      setCampuses(res.data || []);
    } catch (err) {
      toast.error("Failed to load campuses", err);
    }
  };

  useEffect(() => {
    fetchCampuses();
  }, []);

  const openCreateModal = () => {
    setEditingCampus(null);
    reset(defaultValues);
    setIsModalOpen(true);
  };

  const openEditModal = (campus) => {
    setEditingCampus(campus);

    reset({
      name: campus.name || "",
      code: campus.code || "",
      location: campus.location || "",
      status: campus.status ?? true,
      description: campus.description || "",
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCampus(null);
    reset(defaultValues);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      name: data.name?.trim(),
      code: data.code.trim(),
      location: data.location?.trim() || null,
      status: data.status === true || data.status === "true",
      description: data.description?.trim() || null,
    };

    try {
      if (editingCampus) {
        await api.put(`/campuses/${editingCampus.id}`, payload);
        toast.success("Campus updated successfully!");
      } else {
        await api.post("/campuses", payload);
        toast.success("Campus created successfully!");
      }

      closeModal();
      fetchCampuses();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (editingCampus
            ? "Failed to update campus"
            : "Failed to create campus"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (campus) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${campus.name}?`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/campuses/${campus.id}`);
      toast.success("Campus deleted successfully!");
      setCampuses((current) => current.filter((item) => item.id !== campus.id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete campus");
    }
  };

  const handleToggleStatus = async (campus) => {
    try {
      await api.patch(`/campuses/${campus.id}/status`, {
        status: !campus.status,
      });

      toast.success(
        campus.status
          ? "Campus deactivated successfully!"
          : "Campus activated successfully!",
      );

      fetchCampuses();
    } catch (err) {
      toast.error("Failed to update campus status", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Campus and Staff Type Registration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage registered campuses and Staff Type and their contact
            information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Create Campus Name
          </button>
          <button
            type="button"
            onClick={openCreateStaffModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Create Staff Type
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Created Campuses</h3>
          <span className="text-sm text-slate-500">
            Total: {campuses.length}
          </span>
        </div>

        {campuses.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-300 rounded-lg">
            <p className="text-slate-500">No campuses registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="p-3 font-semibold text-slate-700">Campus</th>
                  <th className="p-3 font-semibold text-slate-700">Code</th>
                  <th className="p-3 font-semibold text-slate-700">Location</th>
                  <th className="p-3 font-semibold text-slate-700">Status</th>
                  <th className="p-3 font-semibold text-slate-700 text-right">
                    Management
                  </th>
                </tr>
              </thead>

              <tbody>
                {campuses.map((campus) => (
                  <tr
                    key={campus.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">
                        {campus.name}
                      </div>
                      {campus.description && (
                        <div className="text-xs text-slate-500 mt-1">
                          {campus.description}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-slate-700">{campus.code}</td>

                    <td className="p-3 text-slate-700">
                      {campus.location || "-"}
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          campus.status
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {campus.status ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(campus)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-xs font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(campus)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-xs font-semibold"
                        >
                          {campus.status ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(campus)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-800">
                {editingCampus ? "Edit Campus" : "Create Campus"}
              </h3>

              <button
                type="button"
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Campus Name
                  </label>
                  <input
                    {...register("name", {
                      required: "Campus name is required",
                    })}
                    placeholder="Main Campus"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Campus Code
                  </label>
                  <input
                    {...register("code", {
                      required: "Campus code is required",
                    })}
                    placeholder="C01"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <input
                    {...register("location")}
                    placeholder="Tulu Awlia"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Short campus description"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingCampus
                      ? "Update Campus"
                      : "Save Campus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              {/* <h3 className="text-xl font-bold text-slate-800">Create Staff</h3>

              <button
                type="button"
                onClick={closeStaffModal}
                className="text-slate-500 hover:text-slate-900 text-2xl leading-none"
              >
                ×
              </button> */}
              <h3 className="text-xl font-bold">Manage Staff Types</h3>
              <button onClick={closeStaffModal} className="text-2xl">
                ×
              </button>
            </div>
            <div className="p-6">
              {/* Toggle Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                  View All
                </button>
                <button
                  onClick={() => setViewMode("create")}
                  className={`px-4 py-2 rounded-lg ${viewMode === "create" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                  Add New
                </button>
              </div>

              {viewMode === "list" ? (
                <ul className="space-y-2">
                  {staffTypes.map((type) => (
                    <li
                      key={type.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <span>{type.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditStaffType(type)}
                          className="text-blue-600 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteStaffType(type.id)}
                          className="text-red-500 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <form onSubmit={handleStaffSubmit(onSubmitStaff)}>
                  <div className="px-6 py-5 grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        Staff Type
                      </label>
                      <input
                        {...registerStaff("staffTypeName", {
                          required: "Staff Type is required",
                        })}
                        placeholder="Enter staff type (e.g. Admin, Academic, ICT)"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                      />
                      {staffErrors.staffTypeName && (
                        <p className="text-sm text-red-500">
                          {staffErrors.staffTypeName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        Campus
                      </label>
                      <select
                        {...registerStaff("campusId", {
                          required: "Campus is required",
                        })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                      >
                        <option value="">Select campus</option>
                        {campuses.map((campus) => (
                          <option key={campus.id} value={campus.id}>
                            {campus.name} ({campus.code})
                          </option>
                        ))}
                      </select>
                      {staffErrors.campusId && (
                        <p className="text-sm text-red-500">
                          {staffErrors.campusId.message}
                        </p>
                      )}

                      {campuses.length === 0 && (
                        <p className="text-sm text-amber-600">
                          Please create a campus first before registering staff.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                      type="button"
                      onClick={closeStaffModal}
                      className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isStaffSubmitting || campuses.length === 0}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isStaffSubmitting ? "Saving..." : "Save Staff"}
                    </button>
                  </div>
                </form>
              )}

              {editStaffType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg w-[400px]">
                    <h2 className="text-lg font-bold mb-4">Edit Staff Type</h2>

                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border p-2 rounded mb-4"
                      placeholder="Staff type name"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={closeEditStaffType}
                        className="px-3 py-1 border rounded"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={updateStaffType}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusRegistration;
