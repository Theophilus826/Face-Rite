import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

export default function AdminUsersPanel() {
  const socketRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("https://swordgame-5.onrender.com/admin", {
      path: "/socket.io",
      withCredentials: true,
      auth: { token },
      reconnection: true,
    });
    socketRef.current = socket;

    const init = () => {
      socket.emit("admin:getUsers");
    };

    socket.on("connect", init);
    socket.on("reconnect", init);

    socket.on("users:list", (data) => {
      const list = Array.isArray(data) ? data : data.users || data;
      setUsers(list);
    });

    socket.on("user:status", ({ userId, online }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId
            ? { ...user, online }
            : user
        )
      );

      setSelectedUser((prev) =>
        prev && prev._id === userId
          ? { ...prev, online }
          : prev
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const filteredUsers = users
    .filter((user) =>
      user.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((user) =>
      showOnlineOnly ? user.online : true
    );

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* LEFT PANEL */}

      <div className="col-span-2 bg-white rounded-lg shadow p-5">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold">
            Users ({filteredUsers.length})
          </h2>

          <button
            onClick={() =>
              setShowOnlineOnly(!showOnlineOnly)
            }
            className={`px-4 py-2 rounded ${
              showOnlineOnly
                ? "bg-green-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {showOnlineOnly
              ? "Showing Online"
              : "Online Only"}
          </button>
        </div>

        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full border rounded p-3 mb-5"
        />

        <div className="space-y-2">

          {filteredUsers.map((user) => (

            <div
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition ${
                selectedUser?._id === user._id
                  ? "bg-blue-100 border border-blue-400"
                  : "hover:bg-gray-100"
              }`}
            >

              <div className="flex items-center gap-4">

                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-bold">
                    {user.name?.charAt(0)}
                  </div>
                )}

                <div>

                  <h3 className="font-semibold">
                    {user.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {user.email || user.phone}
                  </p>

                </div>

              </div>

              <div className="text-right">

                <span
                  className={`font-semibold ${
                    user.online
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {user.online
                    ? "Online"
                    : "Offline"}
                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="bg-white rounded-lg shadow p-5">

        <h2 className="text-2xl font-bold mb-5">
          User Details
        </h2>

        {selectedUser ? (

          <>

            <div className="flex flex-col items-center mb-5">

              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-300 flex items-center justify-center text-4xl font-bold">
                  {selectedUser.name?.charAt(0)}
                </div>
              )}

              <h3 className="mt-3 text-xl font-bold">
                {selectedUser.name}
              </h3>

            </div>

            <div className="space-y-3 text-sm">

              <p>
                <strong>ID:</strong>{" "}
                {selectedUser._id}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {selectedUser.email || "N/A"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {selectedUser.phone || "N/A"}
              </p>

              <p>
                <strong>Coins:</strong>{" "}
                {selectedUser.coins ?? 0}
              </p>

              <p>
                <strong>Mood:</strong>{" "}
                {selectedUser.mood || "None"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    selectedUser.online
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {selectedUser.online
                    ? "Online"
                    : "Offline"}
                </span>
              </p>

              <p>
                <strong>Verified:</strong>{" "}
                {selectedUser.isVerified
                  ? "✅ Yes"
                  : "❌ No"}
              </p>

              <p>
                <strong>Admin:</strong>{" "}
                {selectedUser.isAdmin
                  ? "✅ Yes"
                  : "❌ No"}
              </p>

              <p>
                <strong>Referral Code:</strong>{" "}
                {selectedUser.referralCode || "-"}
              </p>

              <p>
                <strong>Contacts:</strong>{" "}
                {selectedUser.contacts?.length || 0}
              </p>

              <p>
                <strong>Joined:</strong>{" "}
                {selectedUser.createdAt
                  ? new Date(
                      selectedUser.createdAt
                    ).toLocaleString()
                  : "-"}
              </p>

              <p>
                <strong>Last Active:</strong>{" "}
                {selectedUser.lastActive
                  ? new Date(
                      selectedUser.lastActive
                    ).toLocaleString()
                  : "Never"}
              </p>

            </div>

            <div className="mt-6 space-y-3">

              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                View Activity
              </button>

              <button className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600">
                Edit User
              </button>

              <button className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
                Suspend User
              </button>

            </div>

          </>

        ) : (

          <div className="flex items-center justify-center h-80 text-gray-500">
            Select a user to view details.
          </div>

        )}

      </div>

    </div>
  );
}