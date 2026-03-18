import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, loginUser, reset } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) toast.error(message);

    // Automatically log in after successful registration
    if (isSuccess) {
      toast.success("Registration successful");
      dispatch(
        loginUser({ email: formData.email, password: formData.password })
      );
    }

    if (user) navigate("/welcome");

    dispatch(reset());
  }, [
    isError,
    isSuccess,
    message,
    dispatch,
    navigate,
    user,
    formData.email,
    formData.password,
  ]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    dispatch(registerUser(formData));
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900">
          Register
        </h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={onChange}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400"
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-700 text-sm">
          Already have an account?{" "}
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}