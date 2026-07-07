// export default Login;
import React, { useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import { useNavigate } from "react-router-dom";

// Validation Schema — login
const schema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

// Validation for forgot-password form
const forgotSchema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});

const Login = () => {
  // Login form
  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const navigate = useNavigate();

  // Forgot form (separate instance)
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
    reset: resetForgotForm,
    setFocus: setForgotFocus,
  } = useForm({ resolver: yupResolver(forgotSchema) });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotIsSubmitting, setForgotIsSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const { login } = useContext(AuthContext);

  // Focus the forgot email input when modal opens
  useEffect(() => {
    if (showForgot) {
      setTimeout(() => setForgotFocus("email"), 100);
    }
  }, [showForgot, setForgotFocus]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post("/users/login", data);
      const { token, ...userData } = response.data;

      login(userData, token);
      toast.success(`Welcome back, ${userData.name}! 👋`);

      if (userData.role === "admin") {
        //window.location.href = "/admin/dashboar404d";
        navigate("/admin/dashboard");
      } else {
        // window.location.href = "/dashboard";
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (values) => {
    setForgotIsSubmitting(true);
    try {
      await api.post("/users/forgot-password", { email: values.email });
      setForgotSent(true);
      toast.success(
        "If this email is registered, a password reset link has been sent.",
      );
    } catch (error) {
      toast.info(
        error.response?.data?.message ||
          "If this email is registered, we'll send instructions to reset your password.",
      );
      setForgotSent(true);
    } finally {
      setForgotIsSubmitting(false);
    }
  };

  const closeForgotPanel = () => {
    setShowForgot(false);
    setTimeout(() => {
      resetForgotForm();
      setForgotSent(false);
    }, 200); // Wait for potential unmount animations
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 py-10 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000 pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-inner mb-2">
            <img
              src="/Icon.jpg"
              alt="MicroFinance Logo"
              className="w-12 h-12 object-contain rounded-xl mix-blend-multiply"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
            Mekdela Amba University
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Saving and Loan System Portal
          </p>
        </div>

        {/* Form Section */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {/* Email */}
          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-semibold text-slate-700 ml-1"
              htmlFor="login-email"
            >
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                id="login-email"
                type="email"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 text-slate-900 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-300 outline-none shadow-sm placeholder:text-slate-400"
                placeholder="you@example.com"
                autoComplete="email"
                {...registerForm("email")}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500 mt-1 ml-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1.5">
            <label
              className="text-sm font-semibold text-slate-700 ml-1"
              htmlFor="login-password"
            >
              Password
            </label>
            <div className="relative group">
              <PasswordInput
                id="login-password"
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-slate-50/50 text-slate-900 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-300 outline-none shadow-sm placeholder:text-slate-400"
                {...registerForm("password")}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 mt-1 ml-1 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="text-blue-600 font-medium hover:text-indigo-600 transition-colors"
              onClick={() => setShowForgot(true)}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin inline-block" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Section */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() =>
                toast.info(
                  "Please contact the system administrator to set up an account.",
                )
              }
              className="text-blue-600 font-semibold hover:text-indigo-600 transition-colors duration-200 underline-offset-4 hover:underline"
            >
              Contact Administrator
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal Overlay */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Reset Password
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Enter your email and we'll send a reset link to your inbox.
                </p>
              </div>
              <button
                onClick={closeForgotPanel}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                title="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {!forgotSent ? (
              <form
                onSubmit={handleForgotSubmit(handleForgotPassword)}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    {...registerForgot("email")}
                    className="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                  {forgotErrors.email && (
                    <p className="text-sm text-red-500 mt-1.5 font-medium">
                      {forgotErrors.email.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={forgotIsSubmitting}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 flex justify-center items-center"
                  >
                    {forgotIsSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                        Sending...
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeForgotPanel}
                    className="w-full py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h4 className="text-slate-900 font-semibold mb-2">
                  Check your email
                </h4>
                <p className="text-sm text-slate-600 mb-6">
                  If the email is registered, you will receive a reset link
                  shortly.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={closeForgotPanel}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    Back to Login
                  </button>
                  <button
                    onClick={() => {
                      resetForgotForm();
                      setForgotSent(false);
                    }}
                    className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                  >
                    Try another email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
