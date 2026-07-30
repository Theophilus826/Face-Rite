import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { loginUser, reset, sendMood } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";
import Mode from "../component/Mode";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMode, setShowMode] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, message } = useSelector(
    (state) => state.auth
  );

  // ================= EFFECT =================
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (user) {
      setShowMode(true);
    }

    dispatch(reset());
  }, [user, isError, message, dispatch]);

  // ================= LOGIN =================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error("Please enter email/phone and password");
      return;
    }

    dispatch(
      loginUser({
        identifier: identifier.trim(),
        password,
      })
    );
  };

  // ================= MOOD =================
  const handleMoodSelect = async (mood) => {
    try {
      await dispatch(sendMood(mood)).unwrap();
      setShowMode(false);
      navigate("/welcome");
    } catch (err) {
      toast.error("Failed to send mood");
    }
  };

  const handleSkip = () => {
    setShowMode(false);
    navigate("/welcome");
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      {/* Mood Modal */}
      {showMode && (
        <div className="fixed inset-0 z-50">
          <Mode onSelectMood={handleMoodSelect} onSkip={handleSkip} />
        </div>
      )}

      {/* Login Page */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* EMAIL OR PHONE */}
            <input
              type="text"
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="p-4 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="username"
            />

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pr-12 rounded-lg bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoComplete="current-password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-400 transition"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Helper */}
          <p className="text-xs text-center text-gray-500 mt-3">
            Use email or Nigerian phone number (e.g. 080..., +234...)
          </p>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-700">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Create account
            </span>
          </p>
        </div>
      </div>
    </>
  );
}