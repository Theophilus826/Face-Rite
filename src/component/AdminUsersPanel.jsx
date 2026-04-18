import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://swordgame-5.onrender.com"); // your backend

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ Initial Load
  useEffect(() => {
    socket.emit("admin:getUsers");

    socket.on("users:list", (data) => {
      setUsers(data);
    });

    // ✅ Live Status Updates
    socket.on("user:status", ({ userId, online }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, online } : user
        )
      );
    });

    return () => {
      socket.off("users:list");
      socket.off("user:status");
    };
  }, []);

  // ✅ Filtering Logic
  const filteredUsers = users
    .filter((user) =>
      user.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((user) => (showOnlineOnly ? user.online : true));

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* ✅ LEFT PANEL */}
      <div className="col-span-2 bg-white p-4 shadow rounded">
        <h2 className="text-xl font-bold mb-4">Users</h2>

        {/* ✅ Controls */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />

          <button
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`px-4 py-2 rounded ${
              showOnlineOnly
                ? "bg-green-500 text-white"
                : "bg-gray-200"
            }`}
          >
            Online Only
          </button>
        </div>

        {/* ✅ User List */}
        <ul className="space-y-2">
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`flex items-center justify-between p-3 rounded cursor-pointer transition ${
                selectedUser?.id === user.id
                  ? "bg-blue-100"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    user.online
                      ? "bg-green-500"
                      : "bg-purple-500"
                  }`}
                />

                <span>{user.name}</span>
              </div>

              <span className="text-sm text-gray-500">
                {user.online ? "Online" : "Offline"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ✅ RIGHT PANEL → USER DETAILS */}
      <div className="bg-white p-4 shadow rounded">
        <h2 className="text-xl font-bold mb-4">User Details</h2>

        {selectedUser ? (
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {selectedUser.name}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  selectedUser.online
                    ? "text-green-600"
                    : "text-purple-600"
                }
              >
                {selectedUser.online ? "Online" : "Offline"}
              </span>
            </p>

            <p>
              <strong>ID:</strong> {selectedUser.id}
            </p>

            {/* Example Admin Actions */}
            <div className="pt-3 space-y-2">
              <button className="w-full bg-blue-500 text-white py-2 rounded">
                View Activity
              </button>

              <button className="w-full bg-red-500 text-white py-2 rounded">
                Suspend User
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">
            Select a user to view details
          </p>
        )}
      </div>
    </div>
  );
}
