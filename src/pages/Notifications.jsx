import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Notifications() {
  const { token } = useSelector((state) => state.auth);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevIds = useRef([]);

  const API_BASE = process.env.REACT_APP_API_URL || "https://swordgame-5.onrender.com";

  // =========================
  // 1️⃣ Fetch all notifications from DB
  // =========================
  const fetchNotifications = async (silent = false) => {
    if (!token) {
      console.log("No token, skipping fetch.");
      return;
    }

    try {
      if (!silent) setLoading(true);

      console.log("Fetching notifications from DB...");

      const { data } = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched notifications:", data);

      // Reset prevIds if DB has fewer notifications (helps after reconnect)
      if (data.length < prevIds.current.length) prevIds.current = [];

      // Detect new notifications
      const newOnes = data.filter((n) => !prevIds.current.includes(n._id));
      if (newOnes.length > 0 && silent) {
        console.log("New notifications detected:", newOnes);
        toast.info("🔔 New notification received");
      }

      prevIds.current = data.map((n) => n._id);
      setNotifications(data);

    } catch (err) {
      console.error("Fetch notifications error:", err);
      if (!silent) toast.error(err.response?.data?.message || "Failed to load notifications");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // =========================
  // 2️⃣ Polling every 5s
  // =========================
  useEffect(() => {
    if (!token) return;

    console.log("Initial fetch...");
    fetchNotifications(); // fetch all notifications immediately

    const interval = setInterval(() => {
      console.log("Polling for new notifications...");
      fetchNotifications(true); // silent fetch to detect new notifications
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  // =========================
  // 3️⃣ Mark notification as read
  // =========================
  const handleMarkAsRead = async (id) => {
    try {
      console.log("Marking notification as read:", id);
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
  // 4️⃣ Render UI
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