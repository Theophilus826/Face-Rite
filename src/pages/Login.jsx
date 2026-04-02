import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, reset } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";
import Mode from "../component/Mode"; // ✅ import Mode

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showMode, setShowMode] = useState(false); // ✅ control popup

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) toast.error(message);

    if (user) {
      setShowMode(true); // ✅ show Mode first

      // ⏳ delay navigation
      setTimeout(() => {
        navigate("/welcome");
      }, 2500);
    }

    dispatch(reset());
  }, [user, isError, message, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    dispatch(loginUser({ email, password }));
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      {/* ✅ MODE POPUP OVERLAY */}
      {showMode && (
        <div className="fixed inset-0 z-50">
          <Mode />
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">
          <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900">
            Login
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              required
            />

            <button
              type="submit"
              className="mt-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-700 text-sm">
            Don't have an account?{" "}
            <span className="text-blue-500 hover:underline cursor-pointer">
              Sign up
            </span>
          </p>
        </div>
      </div>
    </>
  );
}