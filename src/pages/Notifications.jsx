import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client";

export default function Notifications() {
  const { token, user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 🔌 Socket connection
    const socket = io("http://localhost:5000", {
      auth: { token },   // ✅ correct for your socketAuth middleware
      withCredentials: true,
    });

    socketRef.current = socket;

    // 🔔 Listen for new notifications
    socket.on("notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);

      toast.info(`🔔 ${notif.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(
        `/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as read");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🔔 Notifications</h1>

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
                <p>{notif.message}</p>
                <span className="text-xs text-gray-400">
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