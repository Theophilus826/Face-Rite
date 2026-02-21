import { FaSignInAlt, FaUser, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, reset } from "../features/AuthSlice";
import Welcome from "../pages/Welcome";

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate("/");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Links */}
          <div className="flex items-center">
            {/* Logo */}
            <Link
              to={user?.isAdmin ? "/admin" : "/"}
              className="text-white font-bold text-lg"
            >
              Face Reward
            </Link>

            {/* Desktop Links */}
            <div className="hidden sm:flex sm:ml-6 space-x-4">
              <Link
                to="/team"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Friend
              </Link>
            </div>
          </div>

          {/* Right: Auth Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white flex items-center gap-1"
                >
                  <Welcome />
                </Link>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 border border-red-500 text-red-500 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-gray-300 hover:text-white"
                >
                  <FaSignInAlt />
                  Login
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-1 text-gray-300 hover:text-white"
                >
                  <FaUser />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
