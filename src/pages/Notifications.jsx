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

  const prevIds = useRef(new Set());
  const socketRef = useRef(null);

  const API_BASE =
    process.env.REACT_APP_API_URL || "https://swordgame-5.onrender.com";

  // =========================
  // Fetch notifications
  // =========================
  const fetchNotifications = async () => {
    console.log("🚀 FETCH TRIGGERED");

    if (!token) {
      console.warn("❌ NO TOKEN — fetch aborted");
      toast.error("No token found");
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Sending request...");

      const res = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ RESPONSE STATUS:", res.status);
      console.log("📦 RAW DATA:", res.data);

      const data = res.data;

      // 🔥 HARD TEST: ensure array
      if (!Array.isArray(data)) {
        console.error("❌ NOT ARRAY:", data);
        toast.error("Invalid response format");
        return;
      }

      // 🔥 HARD TEST: empty check
      if (data.length === 0) {
        console.warn("⚠️ NO NOTIFICATIONS FOUND");
        toast.info("No notifications in DB");
      } else {
        console.log(`📊 ${data.length} notifications loaded`);
        toast.success(`Loaded ${data.length} notifications`);
      }

      // Detect new ones safely
      const newOnes = data.filter((n) => !prevIds.current.has(n._id));

      console.log("🆕 NEW ONES:", newOnes.length);

      newOnes.forEach((n) => {
        console.log("🔔 NEW:", n.message);
        toast.info(`🔔 ${n.message}`);
      });

      // Update Set
      prevIds.current = new Set(data.map((n) => n._id));

      setNotifications(data);
    } catch (err) {
      console.error("❌ FULL ERROR:", err);

      if (err.response) {
        console.error("📛 SERVER ERROR:", err.response.data);
        console.error("📛 STATUS:", err.response.status);
      }

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to load notifications",
      );
    } finally {
      setLoading(false);
      console.log("🏁 FETCH COMPLETE");
    }
  };

  // =========================
  // Socket.IO
  // =========================
  useEffect(() => {
    if (!token || !user) return;

    console.log("🔌 Connecting socket...");

    // 🔥 Prevent duplicate sockets
    if (socketRef.current) {
      console.log("♻️ Cleaning old socket before reconnect");
      socketRef.current.disconnect();
    }

    const socket = io(API_BASE, {
      path: "/socket.io",
      auth: { token }, // ✅ this is what backend reads
      transports: ["websocket"], // 🔥 force websocket (more stable)
      reconnection: true,
    });

    socketRef.current = socket;

    // ✅ Connected
    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
      console.log("🔑 Token sent:", token);
    });

    // 🔥 DEBUG: catch ALL events
    socket.onAny((event, ...args) => {
      console.log("📡 EVENT:", event, args);
    });

    // ✅ Notification handler
    socket.on("notification:new", (notification) => {
      console.log("🔥 RECEIVED:", notification);

      if (!notification?._id) {
        console.warn("⚠️ Invalid notification received");
        return;
      }

      if (!prevIds.current.has(notification._id)) {
        toast.success(`🔔 ${notification.message}`);

        setNotifications((prev) => [notification, ...prev]);

        prevIds.current.add(notification._id);
      } else {
        console.log("⚠️ Duplicate notification skipped");
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });

    return () => {
      console.log("🔌 Cleaning socket...");
      socket.disconnect();
    };
  }, [token, user]);

  // =========================
  // Initial fetch
  // =========================
  useEffect(() => {
    if (!token || !user) return;
    fetchNotifications();
  }, [token, user]);

  // =========================
  // Mark as read
  // =========================
  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error("❌ Mark as read error:", err);
      toast.error("Failed to mark as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // =========================
  // UI
  // =========================
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">
        🔔 Notifications ({unreadCount})
      </h1>

      <div className="text-center mb-4">
        <button
          onClick={() => {
            console.log("🧪 TEST BUTTON CLICKED");

            toast.info("🧪 Testing fetch...");

            fetchNotifications();
          }}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          🧪 Test Fetch Notifications
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
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
                    className="underline text-blue-600"
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
                  className="ml-4 bg-blue-500 text-white px-2 py-1 rounded text-sm"
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
