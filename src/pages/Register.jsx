import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, loginUser, reset } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    identifier: "", // email OR phone
    password: "",
    confirmPassword: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  // ================= EFFECT =================
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success("Account created successfully");

      const isEmail = formData.identifier.includes("@");

      dispatch(
        loginUser({
          identifier: formData.identifier,
          password: formData.password,
        })
      );
    }

    if (user) {
      navigate("/welcome");
    }

    dispatch(reset());
  }, [
    isError,
    isSuccess,
    message,
    user,
    dispatch,
    navigate,
    formData.identifier,
    formData.password,
  ]);

  // ================= HANDLERS =================
  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validatePhoneOrEmail = (value) => {
    if (value.includes("@")) return true; // email
    return /^[0-9+]{10,15}$/.test(value); // phone basic check
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.identifier) {
      return toast.error("Name and email/phone are required");
    }

    if (!validatePhoneOrEmail(formData.identifier)) {
      return toast.error("Enter a valid email or phone number");
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    dispatch(
      registerUser({
        name: formData.name,
        email: formData.identifier.includes("@")
          ? formData.identifier
          : undefined,
        phone: !formData.identifier.includes("@")
          ? formData.identifier
          : undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })
    );
  };

  if (isLoading) return <Spinner />;

  // ================= UI =================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-4">

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">

        <h2 className="text-3xl font-bold text-center mb-8">
          Create Account
        </h2>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">

          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          {/* Email or Phone */}
          <input
            type="text"
            name="identifier"
            placeholder="Email or Phone Number"
            value={formData.identifier}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          {/* Confirm Password */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <button
            type="submit"
            className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-700">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}