import React, { useState, forwardRef } from "react";

// ─── Eye Icon SVGs ─────────────────────────────────────────────────────────────
const EyeOpen = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ─── Password Strength Checker ─────────────────────────────────────────────────
export const getPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  let score = 0;
  let label = "";
  let color = "#e2e8f0";

  if (passed <= 1) {
    score = 1;
    label = "Very Weak";
    color = "#ef4444";
  } else if (passed === 2) {
    score = 2;
    label = "Weak";
    color = "#f97316";
  } else if (passed === 3) {
    score = 3;
    label = "Fair";
    color = "#eab308";
  } else if (passed === 4) {
    score = 4;
    label = "Strong";
    color = "#22c55e";
  } else if (passed === 5) {
    score = 5;
    label = "Very Strong";
    color = "#10b981";
  }

  return { checks, score, label, color };
};

// ─── Strength Meter Component ──────────────────────────────────────────────────
export const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;

  const { checks, score, label, color } = getPasswordStrength(password);
  const segments = 5;

  const requirements = [
    { key: "length", label: "At least 8 characters" },
    { key: "uppercase", label: "One uppercase letter" },
    { key: "lowercase", label: "One lowercase letter" },
    { key: "number", label: "One number" },
    { key: "special", label: "One special character" },
  ];

  return (
    <div className="w-full mt-2">
      {/* Visual Strength Bar */}
      <div className="flex gap-1 h-1.5 w-full">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i < score ? color : "#e2e8f0" }}
          />
        ))}
      </div>

      {/* Label */}
      <div
        className="text-xs font-bold mt-1.5 text-right transition-colors duration-300"
        style={{ color }}
      >
        {label}
      </div>

      {/* Requirements List */}
      <ul className="mt-2 space-y-1 text-xs text-slate-500">
        {requirements.map((req) => (
          <li
            key={req.key}
            className={`flex items-center gap-2 transition-colors duration-200 ${
              checks[req.key] ? "text-slate-800 font-medium" : ""
            }`}
          >
            <span
              className={`block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                checks[req.key] ? "bg-green-500" : "bg-slate-300"
              }`}
            />
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── PasswordInput Component ───────────────────────────────────────────────────
const PasswordInput = forwardRef(
  ({ placeholder = "Enter password", className, ...props }, ref) => {
    const [show, setShow] = useState(false);

    // Default classes to ensure styling if used outside of Login/Register
    const defaultClasses =
      "w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200 outline-none shadow-sm placeholder:text-slate-400";

    // Combine passed className with default classes and padding for the icon
    const inputClasses = `${className || defaultClasses} pr-12`;

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          className={inputClasses}
          placeholder={placeholder}
          {...props}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors duration-200"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeClosed /> : <EyeOpen />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
