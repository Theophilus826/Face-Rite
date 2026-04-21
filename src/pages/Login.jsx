import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, reset, sendMood } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";
import Mode from "../component/Mode";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // ✅ email OR phone
  const [password, setPassword] = useState("");
  const [showMode, setShowMode] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, message } = useSelector(
    (state) => state.auth
  );

  // -------------------- useEffect --------------------
  useEffect(() => {
    if (isError) toast.error(message);

    if (user) {
      // ✅ Show mood modal when user logs in
      setShowMode(true);
    }

    dispatch(reset());
  }, [user, isError, message, dispatch]);

  // -------------------- Submit Login --------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error("Enter email/phone and password");
      return;
    }

    dispatch(
      loginUser({
        identifier,
        password,
      })
    );
  };

  // -------------------- Mood Selection --------------------
  const handleMoodSelect = async (mood) => {
    try {
      // ✅ FIXED: send string, not object
      await dispatch(sendMood(mood)).unwrap();

      setShowMode(false);
      navigate("/welcome");
    } catch (err) {
      toast.error("Failed to send mood: " + err);
    }
  };

  // -------------------- Skip Mood --------------------
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

      {/* Login Form */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">
          <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900">
            Login
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* ✅ Identifier Input */}
            <input
              type="text"
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="p-4 rounded-lg bg-white/50 border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-4 rounded-lg bg-white/50 border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />

            <button
              type="submit"
              className="mt-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* ✅ Optional hint */}
          <p className="text-xs text-center text-gray-500 mt-2">
            Use your email or Nigerian phone number
          </p>

          <p className="mt-6 text-center text-gray-700 text-sm">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-blue-500 hover:underline cursor-pointer"
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    </>
  );
}