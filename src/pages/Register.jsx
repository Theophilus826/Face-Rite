import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { registerUser, reset } from "../features/AuthSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const savedReferral = localStorage.getItem("referralCode") || "";

  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    password: "",
    confirmPassword: "",
  });

  const [referralCode, setReferralCode] = useState(savedReferral);
  const [referralCodeLocked, setReferralCodeLocked] =
    useState(!!savedReferral);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  /* ---------------- GET REFERRAL CODE ---------------- */

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (ref) {
      localStorage.setItem("referralCode", ref);
      setReferralCode(ref);
      setReferralCodeLocked(true);
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

    if (referralCode && !referralCodeLocked) {
      localStorage.setItem("referralCode", referralCode.trim());
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
        referralCode: referralCode.trim() || undefined,
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

        {referralCodeLocked && referralCode && (
          <div className="mb-6 rounded-lg bg-green-100 border border-green-300 text-green-700 p-3 text-center">
            🎉 You're joining with referral code:
            <br />
            <strong>{referralCode}</strong>
          </div>
        )}

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

          {/* Email / Phone */}
          <input
            type="text"
            name="identifier"
            placeholder="Email or Phone Number"
            value={formData.identifier}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          {/* Referral */}
          <input
            type="text"
            placeholder="Referral Code (Optional)"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            disabled={referralCodeLocked}
            className={`p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              referralCodeLocked
                ? "bg-green-50 border-green-300 text-green-700 cursor-not-allowed"
                : "bg-white/50 border-white/40"
            }`}
          />

          {!referralCodeLocked && (
            <small className="text-gray-500 -mt-3">
              Leave empty if you don't have a referral code.
            </small>
          )}

          {referralCodeLocked && (
            <small className="text-green-600 -mt-3">
              Referral code applied from invitation link.
            </small>
          )}

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={onChange}
              className="w-full p-4 pr-12 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition"
            >
              {showPassword ? (
                <EyeOff size={18} className="text-gray-600" />
              ) : (
                <Eye size={18} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={onChange}
              className="w-full p-4 pr-12 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} className="text-gray-600" />
              ) : (
                <Eye size={18} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Submit */}
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