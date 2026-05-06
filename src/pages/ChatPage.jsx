import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

import GroupChatPage from "./GroupChatPage";

export default function ChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  if (groupId) return <GroupChatPage />;

  const [users, setUsers] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    if (!user) return;

    API.get("/users")
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => toast.error("Failed to load users"));
  }, [user]);

  /* ================= LOCAL SEARCH (NO BACKEND CALL) ================= */
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;

    return users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  /* ================= TOGGLE USER ================= */
  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x._id === u._id)
        ? prev.filter((x) => x._id !== u._id)
        : [...prev, u]
    );
  };

  /* ================= CREATE GROUP ================= */
  const createGroup = async () => {
    if (!groupName.trim()) return toast.error("Group name required");
    if (!selectedUsers.length) return toast.error("Select members");

    try {
      const res = await API.post("/group", {
        name: groupName,
        members: selectedUsers.map((u) => u._id),
      });

      toast.success("Group created");

      setShowCreate(false);
      setGroupName("");
      setSelectedUsers([]);
      setSearch("");

      navigate(`/group/${res.data.group._id}`);
    } catch (err) {
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-transparent text-white">

      {/* SIDEBAR */}
      <div className="w-full md:w-1/3 backdrop-blur-xl bg-white/10 border-r border-white/10">

        <div className="p-3 flex justify-between items-center border-b border-white/10">
          <h2 className="font-bold">Chats</h2>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-500/80 hover:bg-green-500 px-3 py-1 rounded text-sm"
          >
            + Group
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="p-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full p-2 rounded bg-white/10 border border-white/10 outline-none"
          />
        </div>

        {/* USERS LIST */}
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className="p-3 cursor-pointer border-b border-white/10 hover:bg-white/10"
            >
              {u.name}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex items-center justify-center text-gray-300">
        Select a chat
      </div>

      {/* MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white w-full max-w-md rounded-xl p-4 space-y-3">

            <h3 className="font-semibold text-lg">Create Group</h3>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full p-2 rounded bg-transparent border border-white/20 outline-none"
            />

            {/* USER PICKER */}
            <div className="max-h-48 overflow-y-auto border border-white/20 rounded">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/10"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedUsers.some((s) => s._id === u._id)}
                  />
                  <span>{u.name}</span>
                </div>
              ))}
            </div>

            {/* SELECTED USERS */}
            <div className="flex flex-wrap gap-1">
              {selectedUsers.map((u) => (
                <span
                  key={u._id}
                  className="text-xs bg-blue-500/30 px-2 py-1 rounded"
                >
                  {u.name}
                </span>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 border border-white/20 rounded"
              >
                Cancel
              </button>

              <button
                onClick={createGroup}
                className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
              >
                Create
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}