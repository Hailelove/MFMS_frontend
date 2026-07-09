// export default RegisterMember;
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
// import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
// import { AuthContext } from "../../context/AuthContext";
import PasswordInput, {
  PasswordStrengthMeter,
} from "../../components/PasswordInput";
import { useTranslation } from "react-i18next";

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
  // Personal Info
  fullName: yup.string().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().required("Phone number is required"),
  password: strongPasswordSchema,
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
  gender: yup.string().optional(),
  age: yup
    .number()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .optional(),
  maritalStatus: yup.string().required("Marital status is required"),
  nationalId: yup.string().optional(),
  familySize: yup
    .number()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .optional(),

  // Address
  residentialAddress: yup.string().optional(),
  woreda: yup.string().optional(),
  kebele: yup.string().optional(),

  // Emergency Contact
  emergencyContact: yup.string().optional(),
  emergencyContactPhone: yup.string().optional(),
  emergencyContactRel: yup.string().optional(),

  // Employment
  employeeId: yup.string().required("Employee ID is required"),
  campusId: yup
    .number()
    .typeError("Campus is required")
    .required("Campus is required"),
  staffTypeId: yup
    .number()
    .typeError("Staff type is required")
    .required("Staff type is required"),
  employmentType: yup.string().optional(),
  governmentOfficeName: yup.string().optional(),
  monthlySalary: yup
    .number()
    .typeError("Monthly salary must be a number")
    .required("Monthly salary is required"),
  dateOfEmployment: yup.date().optional(),

  // Financial
  initialSavingAmount: yup
    .number()
    .typeError("Initial saving amount must be a number")
    .min(0, "Cannot be negative")
    .required("Initial saving amount is required"),
  initialShareAmount: yup
    .number()
    .typeError("Initial share amount must be a number")
    .min(0, "Cannot be negative")
    .required("Initial share amount is required"),
  initialShareQuantity: yup
    .number()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .min(0, "Cannot be negative")
    .optional(),
});

const requiredBulkHeaders = [
  "fullName",
  "email",
  "password",
  "employeeId",
  "phone",
  "campusId",
  "staffTypeId",
  "monthlySalary",
  "initialSavingAmount",
  "initialShareAmount",
  "maritalStatus",
];

const optionalBulkHeaders = [
  "gender",
  "age",
  "nationalId",
  "familySize",
  "residentialAddress",
  "woreda",
  "kebele",
  "emergencyContact",
  "emergencyContactPhone",
  "emergencyContactRel",
  "employmentType",
  "governmentOfficeName",
  "dateOfEmployment",
  "initialShareQuantity",
];

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
  const missingHeaders = requiredBulkHeaders.filter(
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

    requiredBulkHeaders.forEach((header) => {
      if (!row[header]) {
        throw new Error(`Row ${index + 2}: ${header} is required.`);
      }
    });

    return row;
  });
};

const downloadTemplate = () => {
  const allHeaders = [...requiredBulkHeaders, ...optionalBulkHeaders];
  const sampleData = [
    "Demeke",
    "deme@example.com",
    "Password@123",
    "EMP-001",
    "+251900000000",
    "1",
    "1",
    "15000",
    "500",
    "1000",
    "SINGLE",
    "MALE",
    "35",
    "NID-123",
    "4",
    "Addis Ababa",
    "Woreda 1",
    "Kebele 2",
    "Jane Doe",
    "+251911111111",
    "Wife",
    "PERMANENT",
    "Ministry of Education",
    "2020-01-01",
    "1",
  ];

  const sampleRows = [allHeaders.join(","), sampleData.join(",")];

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
  gender: data.gender?.trim() || undefined,
  age: data.age ? Number(data.age) : undefined,
  maritalStatus: data.maritalStatus?.trim(),
  nationalId: data.nationalId?.trim() || undefined,
  familySize: data.familySize ? Number(data.familySize) : undefined,

  residentialAddress: data.residentialAddress?.trim() || undefined,
  woreda: data.woreda?.trim() || undefined,
  kebele: data.kebele?.trim() || undefined,

  emergencyContact: data.emergencyContact?.trim() || undefined,
  emergencyContactPhone: data.emergencyContactPhone?.trim() || undefined,
  emergencyContactRel: data.emergencyContactRel?.trim() || undefined,

  campusId: Number(data.campusId),
  staffTypeId: Number(data.staffTypeId),
  employmentType: data.employmentType?.trim() || undefined,
  governmentOfficeName: data.governmentOfficeName?.trim() || undefined,
  monthlySalary: Number(data.monthlySalary),
  dateOfEmployment: data.dateOfEmployment
    ? new Date(data.dateOfEmployment)
    : undefined,

  initialSavingAmount: Number(data.initialSavingAmount),
  initialShareAmount: Number(data.initialShareAmount),
  initialShareQuantity: data.initialShareQuantity
    ? Number(data.initialShareQuantity)
    : undefined,
});

const RegisterMember = () => {
  const { t } = useTranslation("member", "common");
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

  const staffOptions =
    selectedCampus?.campusStaffTypes?.map((cst) => cst.staffType) || [];

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const res = await api.get("/campuses");
        setCampuses(res.data || []);
      } catch (err) {
        toast.error("Could not load campuses", err.message || "");
      }
    };

    fetchCampuses();
  }, []);

  useEffect(() => {
    setValue("staffTypeId", "");
  }, [selectedCampusId, setValue]);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const watchedPassword = watch("password", "");

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      await api.post("/users/register-member", buildPayload(data), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Account created successfully. Welcome!");
      reset();
    } catch (error) {
      console.error(
        "Registration Error:",
        error.response?.data || error.message,
      );
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
        await api.post("/users/register-member", buildPayload(row), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
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

  // Helper component for standard input fields
  const InputField = ({
    label,
    id,
    type = "text",
    placeholder,
    registerName,
    error,
    min,
    step,
  }) => (
    <div className="flex flex-col space-y-1.5">
      <label className="text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        min={min}
        step={step}
        className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm"
        placeholder={placeholder}
        {...registerForm(registerName)}
      />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="mb-8 flex items-center justify-between gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {t("Member Registration")}
        </h2>
        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          {t("Bulk Import")}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* SECTION: Personal Info */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 ">
            {t("Personal Information", { ns: "member" })}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <InputField
              label={t("Full Name")}
              id="reg-full-name"
              placeholder="John Doe"
              registerName="fullName"
              error={errors.fullName}
            />
            <InputField
              label={t("Email Address")}
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              registerName="email"
              error={errors.email}
            />
            <InputField
              label={t("Phone")}
              id="reg-phone"
              type="tel"
              placeholder="+251900000000"
              registerName="phone"
              error={errors.phone}
            />

            <div className="flex flex-col space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="reg-gender"
              >
                {t("Gender")}
              </label>
              <select
                id="reg-gender"
                className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                {...registerForm("gender")}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <InputField
              label={t("Age")}
              id="reg-age"
              type="number"
              placeholder="30"
              registerName="age"
              error={errors.age}
            />

            <div className="flex flex-col space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="reg-marital"
              >
                {t("Marital Status")}
              </label>
              <select
                id="reg-marital"
                className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                {...registerForm("maritalStatus")}
              >
                <option value="" disabled>
                  Select Marital Status
                </option>
                <option value="SINGLE">SINGLE</option>
                <option value="MARRIED">MARRIED</option>
                <option value="DIVORCED">DIVORCED</option>
                <option value="WIDOWED">WIDOWED</option>
              </select>
              {errors.maritalStatus && (
                <p className="text-red-500 text-sm">
                  {errors.maritalStatus.message}
                </p>
              )}
            </div>

            <InputField
              label={t("National ID")}
              id="reg-national-id"
              placeholder="NID-12345"
              registerName="nationalId"
              error={errors.nationalId}
            />
            <InputField
              label={t("Family Size")}
              id="reg-family-size"
              type="number"
              placeholder="4"
              registerName="familySize"
              error={errors.familySize}
            />
          </div>
        </section>

        {/* SECTION: Security */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 ">
            {" "}
            {/* border-b pb-2 */}
            {t("Security")}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="reg-password"
              >
                {t("Password")}
              </label>
              <PasswordInput
                id="reg-password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                {...registerForm("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
              <PasswordStrengthMeter password={watchedPassword} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="reg-confirm"
              >
                {t("Confirm Password")}
              </label>
              <PasswordInput
                id="reg-confirm"
                placeholder="Repeat your password"
                autoComplete="new-password"
                {...registerForm("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION: Address Details */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 ">
            {t("Address Details")}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <InputField
              label={t("Residential Address")}
              id="reg-res-address"
              placeholder="Addis Ababa"
              registerName="residentialAddress"
              error={errors.residentialAddress}
            />
            <InputField
              label={t("Woreda")}
              id="reg-woreda"
              placeholder="Woreda 01"
              registerName="woreda"
              error={errors.woreda}
            />
            <InputField
              label={t("Kebele")}
              id="reg-kebele"
              placeholder="Kebele 02"
              registerName="kebele"
              error={errors.kebele}
            />
          </div>
        </section>

        {/* SECTION: Emergency Contact */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 ">
            {t("Emergency Contact ")}(Next of Kin)
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <InputField
              label={t("Contact Name")}
              id="reg-emer-name"
              placeholder="Jane Doe"
              registerName="emergencyContact"
              error={errors.emergencyContact}
            />
            <InputField
              label={t("Contact Phone")}
              id="reg-emer-phone"
              type="tel"
              placeholder="+251911111111"
              registerName="emergencyContactPhone"
              error={errors.emergencyContactPhone}
            />
            <InputField
              label={t("Relationship")}
              id="reg-emer-rel"
              placeholder="Wife / Brother"
              registerName="emergencyContactRel"
              error={errors.emergencyContactRel}
            />
          </div>
        </section>

        {/* SECTION: Employment */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 ">
            {t("Employment Information")}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <InputField
              label={t("Employee ID")}
              id="reg-employee-id"
              placeholder="EMP-001"
              registerName="employeeId"
              error={errors.employeeId}
            />

            <div className="flex flex-col space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="reg-campus"
              >
                {t("Select Campus")}
              </label>
              <select
                id="reg-campus"
                {...registerForm("campusId")}
                className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">-- Choose a Campus --</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name} ({campus.code})
                  </option>
                ))}
              </select>
              {errors.campusId && (
                <p className="text-sm text-red-500">
                  {errors.campusId.message}
                </p>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="reg-staff-type"
              >
                {t("Staff Type")}
              </label>
              <select
                id="reg-staff-type"
                {...registerForm("staffTypeId", {
                  required: "Staff type is required",
                })}
                disabled={!selectedCampusId || staffOptions.length === 0}
                className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedCampusId
                    ? "-- Select campus first --"
                    : staffOptions.length === 0
                      ? "-- No staff types --"
                      : "-- Choose staff type --"}
                </option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
              {errors.staffTypeId && (
                <p className="text-sm text-red-500">
                  {errors.staffTypeId.message}
                </p>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="reg-emp-type"
              >
                {t("Employment Type")}
              </label>
              <select
                id="reg-emp-type"
                className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                {...registerForm("employmentType")}
              >
                <option value="">Select Type</option>
                <option value="PERMANENT">PERMANENT</option>
                <option value="CONTRACT">CONTRACT</option>
                <option value="TEMPORARY">TEMPORARY</option>
              </select>
            </div>

            <InputField
              label={t("Government Office Name")}
              id="reg-gov-office"
              placeholder="Ministry of Education"
              registerName="governmentOfficeName"
              error={errors.governmentOfficeName}
            />
            <InputField
              label={t("Date of Employment")}
              id="reg-date-emp"
              type="date"
              registerName="dateOfEmployment"
              error={errors.dateOfEmployment}
            />
            <InputField
              label={t("Monthly Salary")}
              id="reg-salary"
              type="number"
              placeholder="15000"
              registerName="monthlySalary"
              error={errors.monthlySalary}
            />
          </div>
        </section>

        {/* SECTION: Initial Financials */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {t("Initial Financials")}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <InputField
              label={t("Initial Saving Amount")}
              id="reg-initial-saving"
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              registerName="initialSavingAmount"
              error={errors.initialSavingAmount}
            />
            <InputField
              label={t("Initial Share Amount")}
              id="reg-initial-share"
              type="number"
              min="0"
              step="0.01"
              placeholder="1000"
              registerName="initialShareAmount"
              error={errors.initialShareAmount}
            />
            <InputField
              label={t("Initial Share Quantity")}
              id="reg-initial-share-qty"
              type="number"
              min="0"
              placeholder="1"
              registerName="initialShareQuantity"
              error={errors.initialShareQuantity}
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg"
        >
          {/* {isSubmitting ? "Creating account..." : "Register Member"} */}
          {isSubmitting ? t("Creating Account...") : t("Register Member")}
        </button>
      </form>

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-800">
                {t("Bulk Import Members")}
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-500 hover:text-slate-900 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-800 mb-2">
                  {t("Requirements")}
                </h4>
                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                  <li>{t("File type must be CSV.")}</li>
                  <li>
                    {t("First row must contain the correct column headers.")}
                  </li>
                  <li>
                    <strong>{t("Required columns:")}</strong>{" "}
                    {requiredBulkHeaders.join(", ")}
                  </li>
                  <li>
                    <strong>{t("Optional columns:")}</strong>{" "}
                    {optionalBulkHeaders.join(", ")}
                  </li>
                  <li>
                    {t("Passwords must follow the strong password rules.")}
                  </li>
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {t("Download Template")}
                </button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bulk-file"
                  className="block text-sm font-medium text-slate-700"
                >
                  {t("Choose CSV File")}
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
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={bulkImporting || bulkRows.length === 0}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {bulkImporting ? t("Importing...") : t("Import Members")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterMember;
