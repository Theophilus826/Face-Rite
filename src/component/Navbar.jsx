import { FaSignInAlt, FaUser, FaShareAlt, FaBell } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Welcome from "../pages/Welcome";
import Share from "./Share";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

function Navbar() {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const socketRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // =======================
  // SOCKET FOR NOTIFICATIONS
  // =======================
  useEffect(() => {
    if (!token || !user) return;

    const socket = io("https://swordgame-5.onrender.com", {
      path: "/socket.io",
      withCredentials: true,
      auth: { token },
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔔 Notification socket connected");
      socket.emit("join", { userId: user._id });
    });

    socket.on("notification", (notif) => {
      setNotifications((prev) => [
        { ...notif, read: false, id: Date.now() },
        ...prev,
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  // =======================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // =======================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <>
      <nav className="bg-transparent border-b border-gray-700/40 sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto max-w-screen-sm md:max-w-7xl px-3">
          <div className="flex h-14 md:h-16 items-center justify-between">
            {/* Left */}
            <div className="flex items-center">
              <Link
                to={user?.isAdmin ? "/admin" : "/"}
                className="text-white font-bold text-base md:text-lg"
              >
                Face Reward
              </Link>

              <div className="hidden sm:flex sm:ml-6 space-x-4">
                <Link
                  to="/team"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Friend
                </Link>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {user ? (
                <>
                  {/* Welcome */}
                  <Link
                    to="/"
                    className="text-gray-300 hover:text-white flex items-center"
                  >
                    <Welcome />
                  </Link>

                  {/* Notification */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="text-gray-300 hover:text-white relative"
                    >
                      <FaBell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown */}
                    <div
                      className={`absolute right-0 mt-2 w-64 bg-white rounded shadow-lg z-50 transition-transform duration-200 origin-top-right ${
                        isNotifOpen
                          ? "scale-y-100 opacity-100"
                          : "scale-y-0 opacity-0"
                      } transform`}
                      style={{ transformOrigin: "top" }}
                    >
                      <ul>
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <li
                              key={n.id}
                              className={`p-2 text-sm border-b cursor-pointer ${
                                n.read
                                  ? "bg-gray-100"
                                  : "bg-gray-50 font-medium"
                              } hover:bg-gray-200`}
                              onClick={() => markAsRead(n.id)}
                            >
                              {n.message}
                            </li>
                          ))
                        ) : (
                          <li className="p-2 text-sm text-gray-500">
                            No notifications
                          </li>
                        )}

                        {/* View All */}
                        <li
                          className="p-2 text-center text-blue-500 cursor-pointer hover:bg-gray-100"
                          onClick={() => navigate("/notifications")}
                        >
                          View All
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Share */}
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-1 text-green-400 border border-green-400 px-3 py-1 rounded hover:bg-green-400 hover:text-white transition"
                  >
                    <FaShareAlt />
                    Share
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-1 text-gray-300 hover:text-white text-sm"
                  >
                    <FaSignInAlt />
                    <span className="hidden sm:inline">Login</span>
                  </Link>

                  <Link
                    to="/register"
                    className="flex items-center gap-1 text-gray-300 hover:text-white text-sm"
                  >
                    <FaUser />
                    <span className="hidden sm:inline">Register</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Share Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setIsShareOpen(false)}
            >
              ✕
            </button>
            <Share user={user} token={token} />
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
