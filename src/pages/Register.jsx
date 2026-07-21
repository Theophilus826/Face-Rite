import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, reset } from "../features/AuthSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    password: "",
    confirmPassword: "",
  });

  const [referralCode, setReferralCode] = useState(
    localStorage.getItem("referralCode") || ""
  );

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  /* ---------------- GET REFERRAL CODE ---------------- */

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (ref) {
      localStorage.setItem("referralCode", ref);
      setReferralCode(ref);
    }
  }, [searchParams]);

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess && user?.token) {
      localStorage.removeItem("referralCode");

      toast.success("Account created successfully");

      navigate("/welcome");
    }

    dispatch(reset());
  }, [isError, isSuccess, message, user, dispatch, navigate]);

  /* ---------------- INPUT ---------------- */

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ---------------- VALIDATE ---------------- */

  const validatePhoneOrEmail = (value) => {
    if (value.includes("@")) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    return /^[0-9+]{10,15}$/.test(value);
  };

  /* ---------------- SUBMIT ---------------- */

  const onSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.identifier) {
      return toast.error("Name and Email/Phone are required");
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

        referralCode: referralCode || undefined,
      })
    );
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">

        <h2 className="text-3xl font-bold text-center mb-3">
          Create Account
        </h2>

        {referralCode && (
          <div className="mb-6 rounded-lg bg-green-100 border border-green-300 text-green-700 p-3 text-center">
            🎉 You're joining with referral code:
            <br />
            <strong>{referralCode}</strong>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-5"
        >
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            type="text"
            name="identifier"
            placeholder="Email or Phone Number"
            value={formData.identifier}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

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
            disabled={isLoading}
            className="py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition disabled:bg-gray-400"
          >
            {isLoading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-700">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}