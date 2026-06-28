import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
// import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import PasswordInput, {
  PasswordStrengthMeter,
} from "../../components/PasswordInput";

const strongPasswordSchema = yup
  .string()
  .required("Password is required")
  .min(8, "Password must be at least 8 characters")
  .matches(/[A-Z]/, "Must include at least one uppercase letter")
  .matches(/[a-z]/, "Must include at least one lowercase letter")
  .matches(/[0-9]/, "Must include at least one number")
  .matches(
    /[!@#$%^&*(),.?":{}|<>_\-+=]/,
    "Must include at least one special character",
  );

const schema = yup.object().shape({
  fullName: yup.string().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: strongPasswordSchema,
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
  employeeId: yup.string().required("Employee ID is required"),
  phone: yup.string().required("Phone number is required"),
  campusId: yup
    .number()
    .typeError("Campus is required")
    .required("Campus is required"),
  department: yup.string().required("Department is required"),
  officeUnit: yup.string().optional(),
  position: yup.string().optional(),
  monthlySalary: yup
    .number()
    .typeError("Monthly salary must be a number")
    .required("Monthly salary is required"),
  staffId: yup
    .number()
    .typeError("Staff type is required")
    .required("Staff type is required"),
});

const requiredBulkHeaders = [
  "fullName",
  "email",
  "password",
  "employeeId",
  "phone",
  "campusId",
  "staffType",
  "department",
  "monthlySalary",
  "officeUnit",
  "position",
];

// const optionalBulkHeaders = ["officeUnit", "position"];

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const parseCsv = (text) => {
  const requiredHeaders = [
    "fullName",
    "email",
    "password",
    "employeeId",
    "phone",
    "campusId",
    "department",
    "monthlySalary",
  ];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(
      "CSV must contain a header row and at least one member row.",
    );
  }

  const headers = parseCsvLine(lines[0]);
  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex]?.trim() || "";
    });

    requiredHeaders.forEach((header) => {
      if (!row[header]) {
        throw new Error(`Row ${index + 2}: ${header} is required.`);
      }
    });

    return row;
  });
};

const downloadTemplate = () => {
  const sampleRows = [
    requiredBulkHeaders.join(","),
    "John Doe,john@example.com,Password@123,EMP-001,+251900000000,1,academic, Software Engineering,15000,ICT Office,Lecturer",
  ];

  const blob = new Blob([sampleRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "member-import-template.csv";
  link.click();

  URL.revokeObjectURL(url);
};

const buildPayload = (data) => ({
  fullName: data.fullName?.trim(),
  email: data.email?.trim(),
  password: data.password,
  employeeId: data.employeeId?.trim(),
  phone: data.phone?.trim(),
  campusId: Number(data.campusId),
  staffId: Number(data.staffId),
  department: data.department?.trim(),
  officeUnit: data.officeUnit?.trim() || undefined,
  position: data.position?.trim() || undefined,
  monthlySalary: Number(data.monthlySalary),
});

const RegisterMember = () => {
  const {
    register: registerForm,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({ resolver: yupResolver(schema) });

  const [campuses, setCampuses] = useState([]);
  const selectedCampusId = watch("campusId");

  const selectedCampus = campuses.find(
    (campus) => Number(campus.id) === Number(selectedCampusId),
  );

  const staffOptions = selectedCampus?.staff || [];

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const res = await api.get("/campuses");
        setCampuses(res.data || []);
      } catch (err) {
        toast.error("Could not load campuses", err);
      }
    };

    fetchCampuses();
  }, []);

  useEffect(() => {
    setValue("staffId", "");
  }, [selectedCampusId, setValue]);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const { login } = useContext(AuthContext);
  // const navigate = useNavigate();

  const watchedPassword = watch("password", "");

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const response = await api.post(
        "/users/register-member",
        buildPayload(data),
      );
      const { token, ...userData } = response.data;

      login(userData, token);
      toast.success("Account created successfully. Welcome!");
      // navigate("/dashboard", { replace: true });
      reset();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkFileChange = async (event) => {
    const file = event.target.files?.[0];

    setBulkRows([]);
    setBulkResult(null);
    setBulkFileName("");

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a CSV file.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      setBulkRows(rows);
      setBulkFileName(file.name);
      toast.success(`${rows.length} member(s) ready to import.`);
    } catch (error) {
      toast.error(error.message || "Could not read the CSV file.");
      event.target.value = "";
    }
  };
  const handleBulkImport = async () => {
    if (bulkRows.length === 0) {
      toast.error("Please choose a CSV file first.");
      return;
    }

    setBulkImporting(true);
    setBulkResult(null);

    const failed = [];
    let successCount = 0;

    for (const [index, row] of bulkRows.entries()) {
      try {
        await api.post("/users/register-member", buildPayload(row));
        successCount += 1;
      } catch (error) {
        failed.push({
          row: index + 2,
          email: row.email,
          message:
            error.response?.data?.message ||
            "Registration failed for this row.",
        });
      }
    }

    setBulkResult({ successCount, failed });

    if (failed.length === 0) {
      toast.success(`Bulk import completed. ${successCount} member(s) added.`);
      setBulkRows([]);
      setBulkFileName("");
    } else {
      toast.warning(`Imported ${successCount}. Failed ${failed.length}.`);
    }

    setBulkImporting(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          Member Registration
        </h2>
        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          Bulk Import
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-full-name"
            >
              Full Name
            </label>
            <input
              id="reg-full-name"
              type="text"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              placeholder="John Doe"
              autoComplete="name"
              {...registerForm("fullName")}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-email"
            >
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              placeholder="you@example.com"
              autoComplete="email"
              {...registerForm("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-password"
            >
              Password
            </label>
            <PasswordInput
              id="reg-password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              {...registerForm("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            <PasswordStrengthMeter password={watchedPassword} />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-confirm"
            >
              Confirm Password
            </label>
            <PasswordInput
              id="reg-confirm"
              placeholder="Repeat your password"
              autoComplete="new-password"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              {...registerForm("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-employee-id"
            >
              Employee ID
            </label>
            <input
              id="reg-employee-id"
              type="text"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              placeholder="EMP-001"
              {...registerForm("employeeId")}
            />
            {errors.employeeId && (
              <p className="text-sm text-red-500">
                {errors.employeeId.message}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-phone"
            >
              Phone
            </label>
            <input
              id="reg-phone"
              type="tel"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              placeholder="+251900000000"
              {...registerForm("phone")}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-campus"
            >
              Select Campus
            </label>
            <select
              id="reg-campus"
              {...registerForm("campusId")}
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
            >
              <option value="">-- Choose a Campus --</option>

              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name} ({campus.code})
                </option>
              ))}
            </select>

            {errors.campusId && (
              <p className="text-sm text-red-500">{errors.campusId.message}</p>
            )}
          </div>
          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-staff-type"
            >
              Staff Type
            </label>

            <select
              id="reg-staff-type"
              {...registerForm("staffId")}
              disabled={!selectedCampusId || staffOptions.length === 0}
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedCampusId
                  ? "-- Select campus first --"
                  : staffOptions.length === 0
                    ? "-- No staff found for this campus --"
                    : "-- Choose staff type --"}
              </option>

              {staffOptions.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.role === "ADMIN" ? "Admin Staff" : "Academic Staff"} -{" "}
                  {staff.fullName}
                </option>
              ))}
            </select>

            {errors.staffId && (
              <p className="text-sm text-red-500">{errors.staffId.message}</p>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-department"
            >
              Department
            </label>
            <input
              id="reg-department"
              type="text"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              placeholder="Software Engineering"
              {...registerForm("department")}
            />
            {errors.department && (
              <p className="text-sm text-red-500">
                {errors.department.message}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-office"
            >
              Office Unit
            </label>
            <input
              id="reg-office"
              type="text"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              placeholder="ICT Office"
              {...registerForm("officeUnit")}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-position"
            >
              Position
            </label>
            <input
              id="reg-position"
              type="text"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              placeholder="Lecturer"
              {...registerForm("position")}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="reg-salary"
            >
              Monthly Salary
            </label>
            <input
              id="reg-salary"
              type="number"
              className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
              placeholder="15000"
              {...registerForm("monthlySalary")}
            />
            {errors.monthlySalary && (
              <p className="text-sm text-red-500">
                {errors.monthlySalary.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-800">
                Bulk Import Members
              </h3>

              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-500 hover:text-slate-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-800 mb-2">
                  Requirements
                </h4>

                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                  <li>File type must be CSV.</li>
                  <li>First row must contain the correct column headers.</li>
                  <li>
                    Required columns: fullName, email, password, employeeId,
                    phone, campusId, department, monthlySalary.
                  </li>
                  <li>Optional columns: officeUnit, position.</li>
                  <li>
                    Password must follow the same strong password rule as single
                    registration.
                  </li>
                  <li>
                    Each row will be submitted to the existing registration
                    endpoint one by one.
                  </li>
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Download Template
                </button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bulk-file"
                  className="block text-sm font-medium text-slate-700"
                >
                  Choose CSV File
                </label>

                <input
                  id="bulk-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleBulkFileChange}
                  className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
                />

                {bulkFileName && (
                  <p className="text-sm text-slate-600">
                    Selected: {bulkFileName} ({bulkRows.length} row(s))
                  </p>
                )}
              </div>

              {bulkResult && (
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="font-semibold text-slate-800">
                    Imported: {bulkResult.successCount}
                  </p>

                  <p className="font-semibold text-slate-800">
                    Failed: {bulkResult.failed.length}
                  </p>

                  {bulkResult.failed.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {bulkResult.failed.map((item) => (
                        <p
                          key={`${item.row}-${item.email}`}
                          className="text-sm text-red-600"
                        >
                          Row {item.row} ({item.email}): {item.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBulkImport}
                disabled={bulkImporting || bulkRows.length === 0}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {bulkImporting ? "Importing..." : "Import Members"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterMember;
