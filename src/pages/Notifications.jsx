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
  const eventSourceRef = useRef(null);

  const API_BASE =
    process.env.REACT_APP_API_URL || "https://swordgame-5.onrender.com";

  /* ================= FETCH ================= */

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;

      // 🔔 only toast NEW ones
      const newOnes = data.filter((n) => !prevIds.current.has(n._id));
      newOnes.forEach((n) => toast.info(`🔔 ${n.message}`));

      prevIds.current = new Set(data.map((n) => n._id));
      setNotifications(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  /* ================= REAL-TIME SSE ================= */

  useEffect(() => {
    if (!user?._id) return;

    // 🔥 close old connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(
      `${API_BASE}/api/notifications/stream/${user._id}`
    );

    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("✅ SSE connected");
    };

    es.onerror = (err) => {
      console.error("❌ SSE error:", err);
      toast.error("Connection lost. Reconnecting...");

      es.close();

      // 🔥 auto reconnect
      setTimeout(() => {
        eventSourceRef.current = null;
      }, 3000);
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (!data) return;

        // ignore ping / connected
        if (data.type === "ping" || data.type === "connected") return;

        if (data.type === "notification") {
          const notif = data.notification;

          // prevent duplicates
          if (prevIds.current.has(notif._id)) return;

          prevIds.current.add(notif._id);

          setNotifications((prev) => [notif, ...prev]);

          // 🔔 instant toast
          toast.info(`🔔 ${notif.message}`);
        }
      } catch (err) {
        console.error("SSE PARSE ERROR:", err);
      }
    };

    return () => {
      es.close();
    };
  }, [user]);

  /* ================= MARK READ ================= */

  const handleSelectNotification = async (notif) => {
    if (!notif.read) {
      try {
        await axios.put(
          `${API_BASE}/api/notifications/${notif._id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notif._id ? { ...n, read: true } : n
          )
        );
      } catch {
        toast.error("Failed to mark as read");
      }
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.filter((n) => n._id !== id));

      // remove from cache
      prevIds.current.delete(id);

      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ================= INIT ================= */

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
    }
  }, [token, user]);

  /* ================= UI ================= */

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">
        🔔 Notifications ({unreadCount})
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-500">
          You have no notifications.
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`relative p-4 rounded border flex items-center cursor-pointer transition ${
                notif.read
                  ? "bg-gray-100 text-gray-700"
                  : "bg-white font-bold shadow"
              }`}
              onClick={() => handleSelectNotification(notif)}
            >
              {/* DELETE */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notif._id);
                }}
                className="absolute top-2 left-2 text-red-500 hover:scale-110"
              >
                <FaTrash />
              </button>

              <div className="ml-6 w-full">
                {/* CHAT LINK */}
                {notif.chatUserId ? (
                  <Link
                    to={`/chat/${notif.chatUserId}`}
                    className="text-blue-600 underline"
                  >
                    {notif.message}
                  </Link>
                ) : notif.postId ? (
                  <Link
                    to={`/post/${notif.postId}`}
                    className="text-purple-600 underline"
                  >
                    {notif.message}
                  </Link>
                ) : (
                  <p>{notif.message}</p>
                )}

                <span className="text-xs text-gray-400 block mt-1">
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