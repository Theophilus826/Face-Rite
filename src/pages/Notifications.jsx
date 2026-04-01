import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

export default function Notifications() {
  const { token, user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const prevIds = useRef(new Set());
  const API_BASE =
    process.env.REACT_APP_API_URL || "https://swordgame-5.onrender.com";

  // =========================
  // Fetch notifications
  // =========================
  const fetchNotifications = async () => {
    if (!token) {
      toast.error("No token found");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;

      if (!Array.isArray(data)) {
        toast.error("Invalid response format");
        return;
      }

      const newOnes = data.filter((n) => !prevIds.current.has(n._id));
      newOnes.forEach((n) => toast.info(`🔔 ${n.message}`));

      prevIds.current = new Set(data.map((n) => n._id));
      setNotifications(data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Mark as read on click
  // =========================
  const handleSelectNotification = async (notif) => {
    if (!notif.read) {
      try {
        await axios.put(
          `${API_BASE}/api/notifications/${notif._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
      } catch {
        toast.error("Failed to mark as read");
      }
    }
  };

  // =========================
  // Delete notification
  // =========================
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // =========================
  // Initial fetch
  // =========================
  useEffect(() => {
    if (token && user) fetchNotifications();
  }, [token, user]);

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
          onClick={fetchNotifications}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          🧪 Refresh Notifications
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
              className={`relative p-4 rounded border flex items-center cursor-pointer ${
                notif.read ? "bg-gray-100 text-gray-700" : "bg-white font-bold"
              }`}
              onClick={() => handleSelectNotification(notif)}
            >
              {/* Delete Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notif._id);
                }}
                className="absolute top-2 left-2 text-red-500 hover:text-red-700 text-sm md:text-base"
                title="Delete"
              >
                <FaTrash />
              </button>

              <div className="ml-6 w-full">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}