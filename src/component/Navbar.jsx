import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import {
FaSignInAlt,
FaUser,
FaShareAlt,
FaBell,
FaDownload,
} from "react-icons/fa";

import Welcome from "../pages/Welcome";
import Share from "./Share";

function Navbar() {
const navigate = useNavigate();

const { user, token } = useSelector((state) => state.auth);

const [notifications, setNotifications] = useState([]);
const [isNotifOpen, setIsNotifOpen] = useState(false);
const [isShareOpen, setIsShareOpen] = useState(false);

const notifRef = useRef(null);
const eventSourceRef = useRef(null);
const knownIdsRef = useRef(new Set());

const API_BASE =
process.env.REACT_APP_API_URL || "https://swordgame-5.onrender.com";

const authToken = user?.token || token;

const unreadNotifications = notifications.filter(
(notification) => !notification.read
);

const unreadCount = unreadNotifications.length;

/* ===============================
FETCH NOTIFICATIONS
=============================== */

const fetchNotifications = async () => {
if (!authToken) return;


try {
  const response = await axios.get(
    `${API_BASE}/api/notifications`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  const list = response.data.notifications || [];

  setNotifications(list);

  knownIdsRef.current = new Set(
    list.map((notification) => notification._id)
  );
} catch (error) {
  console.error("Notification fetch error:", error);
}


};

/* ===============================
INITIAL LOAD + SSE
=============================== */

useEffect(() => {
if (!user || !authToken) return;


fetchNotifications();

if (eventSourceRef.current) {
  eventSourceRef.current.close();
}

const source = new EventSource(
  `${API_BASE}/api/notifications/stream?token=${authToken}`
);

eventSourceRef.current = source;

source.onopen = () => {
  console.log("✅ Notification stream connected");
};

source.onmessage = (event) => {
  try {
    const payload = JSON.parse(event.data);

    if (!payload) return;

    if (payload.type === "ping") return;

    if (payload.type === "init") {
      const initialNotifications =
        payload.notifications || [];

      setNotifications(initialNotifications);

      knownIdsRef.current = new Set(
        initialNotifications.map((n) => n._id)
      );

      return;
    }

    if (payload.type === "new") {
      const notification = payload.notification;

      if (!notification) return;

      if (
        knownIdsRef.current.has(notification._id)
      ) {
        return;
      }

      knownIdsRef.current.add(notification._id);

      setNotifications((previous) => [
        notification,
        ...previous,
      ]);

      toast.info(`🔔 ${notification.message}`);
    }
  } catch (error) {
    console.error(
      "Notification stream parse error:",
      error
    );
  }
};

source.onerror = () => {
  console.error(
    "Notification stream disconnected"
  );

  source.close();
};

return () => {
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }
};
```

}, [user, authToken]);

/* ===============================
CLOSE DROPDOWN ON OUTSIDE CLICK
=============================== */

useEffect(() => {
const handleOutsideClick = (event) => {
if (
notifRef.current &&
!notifRef.current.contains(event.target)
) {
setIsNotifOpen(false);
}
};

```
document.addEventListener(
  "mousedown",
  handleOutsideClick
);

return () => {
  document.removeEventListener(
    "mousedown",
    handleOutsideClick
  );
};


}, []);

/* ===============================
MARK NOTIFICATION AS READ
=============================== */

const markAsRead = async (notificationId) => {
try {
await axios.put(
`${API_BASE}/api/notifications/${notificationId}/read`,
{},
{
headers: {
Authorization: `Bearer ${authToken}`,
},
}
);


  setNotifications((previous) =>
    previous.map((notification) =>
      notification._id === notificationId
        ? {
            ...notification,
            read: true,
          }
        : notification
    )
  );
} catch (error) {
  toast.error("Failed to mark notification as read");
}


};

/* ===============================
UI
=============================== */

return (
<> <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500/30 backdrop-blur-md shadow-sm shadow-black/20"> <div className="mx-auto max-w-screen-sm md:max-w-7xl px-3"> <div className="flex h-14 md:h-16 items-center justify-between">
{/* Logo */}
<Link
to={user?.isAdmin ? "/admin" : "/"}
className="text-white font-bold text-base md:text-lg"
>
Face Reward </Link>


        {/* Right Side */}
        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <>
              {/* Welcome */}
              <Link
                to="/"
                className="text-gray-200 hover:text-white"
              >
                <Welcome />
              </Link>

              {/* Download */}
              <button
                onClick={() =>
                  navigate("/download")
                }
                className="flex items-center gap-1 rounded border border-yellow-400 px-2 py-1 text-xs md:text-sm text-yellow-400 transition hover:bg-yellow-400 hover:text-black animate-pulse"
              >
                <FaDownload />
                <span>Download</span>
              </button>

              {/* Notifications */}
              <div
                className="relative"
                ref={notifRef}
              >
                <button
                  onClick={() =>
                    setIsNotifOpen(
                      (previous) => !previous
                    )
                  }
                  className="relative text-gray-300 hover:text-white"
                >
                  <FaBell size={20} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-lg bg-white shadow-lg z-50">
                    <ul>
                      {unreadNotifications.length >
                      0 ? (
                        unreadNotifications
                          .slice(0, 5)
                          .map(
                            (notification) => (
                              <li
                                key={
                                  notification._id
                                }
                                onClick={() =>
                                  markAsRead(
                                    notification._id
                                  )
                                }
                                className="cursor-pointer border-b p-3 text-sm hover:bg-gray-100"
                              >
                                {
                                  notification.message
                                }
                              </li>
                            )
                          )
                      ) : (
                        <li className="p-3 text-sm text-gray-500">
                          No unread notifications
                        </li>
                      )}

                      <li
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate(
                            "/notifications"
                          );
                        }}
                        className="cursor-pointer p-3 text-center text-blue-600 hover:bg-gray-100"
                      >
                        View All Notifications
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Share */}
              <button
                onClick={() =>
                  setIsShareOpen(true)
                }
                className="flex items-center gap-1 rounded border border-green-400 px-3 py-1 text-green-400 transition hover:bg-green-400 hover:text-white"
              >
                <FaShareAlt />
                Share
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
              >
                <FaSignInAlt />
                <span className="hidden sm:inline">
                  Login
                </span>
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
              >
                <FaUser />
                <span className="hidden sm:inline">
                  Register
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  </header>

  {/* Share Modal */}
  {isShareOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={() =>
            setIsShareOpen(false)
          }
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <Share
          user={user}
          token={authToken}
        />
      </div>
    </div>
  )}
</>

);
}

export default Navbar;
