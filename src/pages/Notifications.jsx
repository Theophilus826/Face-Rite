import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";

export default function Notifications() {
  const { token, user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevIds = useRef([]);

  const API_BASE = process.env.REACT_APP_API_URL || "https://swordgame-5.onrender.com";
  const socketRef = useRef(null);

  // =========================
  // 1️⃣ Fetch notifications from DB
  // =========================
  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Detect new notifications
      const newOnes = data.filter((n) => !prevIds.current.includes(n._id));
      if (newOnes.length > 0) {
        newOnes.forEach((n) => toast.info(`🔔 ${n.message}`));
      }

      prevIds.current = data.map((n) => n._id);
      setNotifications(data);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      toast.error(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 2️⃣ Initialize Socket.IO
  // =========================
  useEffect(() => {
    if (!token || !user) return;

    // Connect socket
    console.log("🔌 Connecting socket with token:", token);
    socketRef.current = io(API_BASE, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("🟢 Connected to socket.io");
    });

    // Listen for new notifications pushed from server
    socketRef.current.on("notification:new", (notification) => {
      if (!prevIds.current.includes(notification._id)) {
        toast.info(`🔔 ${notification.message}`);
        setNotifications((prev) => [notification, ...prev]);
        prevIds.current.unshift(notification._id);
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔴 Disconnected from socket.io");
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [token, user]);

  // =========================
  // 3️⃣ Initial DB fetch
  // =========================
  useEffect(() => {
    if (!token || !user) return;
    fetchNotifications();
  }, [token, user]);

  // =========================
  // 4️⃣ Mark as read
  // =========================
  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Mark as read error:", err);
      toast.error("Failed to mark as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // =========================
  // 5️⃣ Render UI
  // =========================
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🔔 Notifications ({unreadCount})
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-500">You have no notifications.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded border flex justify-between items-center ${
                notif.read ? "bg-gray-100 text-gray-700" : "bg-white font-bold"
              }`}
            >
              <div>
                {notif.postId ? (
                  <Link
                    to={`/post/${notif.postId}`}
                    className="underline text-blue-600 hover:text-blue-800"
                  >
                    {notif.message}
                  </Link>
                ) : (
                  <p>{notif.message}</p>
                )}
                <span className="text-xs text-gray-400 block">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>

              {!notif.read && (
                <button
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="ml-4 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}