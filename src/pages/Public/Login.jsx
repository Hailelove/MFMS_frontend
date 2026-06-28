import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";

// Validation Schema — login only needs email + non-empty password
const schema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

const Login = () => {
  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post("/users/login", data);
      const { token, ...userData } = response.data;

      login(userData, token);
      toast.success(`Welcome back, ${userData.name}! 👋`);

      if (userData.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm">
      {/* Header Section */}
      <div className="text-center mb-8">
        <img
          src="/Icon.jpg"
          alt="MicroFinance Logo"
          className="w-16 h-16 mx-auto mb-4 object-contain"
        />
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Login to manage your Saving and Loan account
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email */}
        <div className="flex flex-col space-y-1.5">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="login-email"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200 outline-none shadow-sm placeholder:text-slate-400"
            placeholder="you@example.com"
            autoComplete="email"
            {...registerForm("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col space-y-1.5">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="login-password"
          >
            Password
          </label>
          {/* Note: Ensure your PasswordInput component accepts and applies className props if you want it to match the email input styling perfectly */}
          <PasswordInput
            id="login-password"
            placeholder="Enter your password"
            autoComplete="current-password"
            className="w-full px-4 py-2.5 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200 outline-none shadow-sm placeholder:text-slate-400"
            {...registerForm("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="login-submit"
          disabled={isSubmitting}
          className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-[2.5px] border-white/40 border-t-white rounded-full animate-spin inline-block" />
              <span>Logging in...</span>
            </div>
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* Footer Section */}
      <div className="text-center mt-8">
        <p className="text-slate-500 text-sm">
          If you don&apos;t have an account,{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-200"
          >
            please contact the system administrator.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
