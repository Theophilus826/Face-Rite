import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export default function Notifications() {
  const { token, user } = useSelector((state) => state.auth);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const prevIds = useRef(new Set());
  const eventSourceRef = useRef(null);
  const pushInitializedRef = useRef(false);

  const API_BASE =
    process.env.REACT_APP_API_URL || "https://swordgame-5.onrender.com";

  const authToken = user?.token || token;

  /* ================= FETCH ================= */

  const fetchNotifications = async (silent = false) => {
    if (!authToken) return;

    try {
      if (!silent) setLoading(true);

      const res = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = res.data.notifications || [];

      const newOnes = data.filter((n) => !prevIds.current.has(n._id));

      newOnes.forEach((n) => {
        toast.info(`🔔 ${n.message}`);
      });

      prevIds.current = new Set(data.map((n) => n._id));
      setNotifications(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /* ================= INIT LOAD ================= */

  useEffect(() => {
    fetchNotifications();
  }, [authToken]);

  /* ================= SSE + PUSH ================= */

  useEffect(() => {
    if (!user || !authToken) return;

    let isActive = true;

    /* ================= SSE ================= */
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(
      `${API_BASE}/api/notifications/stream`
    );

    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("✅ SSE connected");
    };

    es.onerror = () => {
      console.error("❌ SSE error");
      es.close();

      setTimeout(() => {
        if (user && authToken) fetchNotifications();
      }, 3000);
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (!data) return;

        // only ignore ping
        if (data.type === "ping") return;

        /* INIT */
        if (data.type === "init") {
          const list = data.notifications || [];

          prevIds.current = new Set(list.map((n) => n._id));
          setNotifications(list);
          return;
        }

        /* NEW NOTIFICATION */
        if (data.type === "new") {
          const notif = data.notification;
          if (!notif || prevIds.current.has(notif._id)) return;

          prevIds.current.add(notif._id);

          setNotifications((prev) => {
            const exists = prev.some((n) => n._id === notif._id);
            if (exists) return prev;
            return [notif, ...prev];
          });

          toast.info(`🔔 ${notif?.message || "New notification"}`);
        }
      } catch (err) {
        console.error("SSE PARSE ERROR:", err);
      }
    };

    /* ================= PUSH (CAPACITOR) ================= */

    const initPush = async () => {
      try {
        if (!Capacitor.isNativePlatform()) return;
        if (!Capacitor.isPluginAvailable("PushNotifications")) return;
        if (pushInitializedRef.current) return;

        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") return;

        PushNotifications.removeAllListeners();

        /* TOKEN */
        PushNotifications.addListener("registration", async (token) => {
          try {
            await fetch(`${API_BASE}/api/notifications/fcm-token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                fcmToken: token.value, // FIXED
              }),
            });
          } catch (err) {
            console.error("FCM SAVE ERROR:", err);
          }
        });

        /* FOREGROUND */
        PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            if (!isActive) return;

            if (notification?.body) {
              toast.info(notification.body);
              fetchNotifications(true);
            }
          }
        );

        /* CLICK */
        PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const data = action?.notification?.data;

            if (data?.postId) {
              window.location.href = `/post/${data.postId}`;
            } else if (data?.chatUserId) {
              window.location.href = `/chat/${data.chatUserId}`;
            }
          }
        );

        await PushNotifications.register();
        pushInitializedRef.current = true;
      } catch (err) {
        console.error("❌ PUSH INIT ERROR:", err);
      }
    };

    initPush();

    /* ================= CLEANUP ================= */
    return () => {
      isActive = false;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (Capacitor.isPluginAvailable("PushNotifications")) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [user, authToken]);

  /* ================= MARK READ ================= */

  const handleSelectNotification = async (notif) => {
    if (!notif.read) {
      try {
        await axios.put(
          `${API_BASE}/api/notifications/${notif._id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${authToken}` },
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
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setNotifications((prev) => prev.filter((n) => n._id !== id));
      prevIds.current.delete(id);

      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
              className={`relative p-4 rounded border flex items-center cursor-pointer ${
                notif.read
                  ? "bg-gray-100 text-gray-700"
                  : "bg-white font-bold shadow"
              }`}
              onClick={() => handleSelectNotification(notif)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notif._id);
                }}
                className="absolute top-2 left-2 text-red-500"
              >
                <FaTrash />
              </button>

              <div className="ml-6 w-full">
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