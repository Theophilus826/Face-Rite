import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

import GroupChatPage from "./GroupChatPage";

export default function ChatPage() {
  const { chatUserId, groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  if (groupId) return <GroupChatPage />;

  const [users, setUsers] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  /* ================= USERS ================= */
  useEffect(() => {
    if (!user) return;

    API.get("/users")
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => toast.error("Failed to load users"));
  }, [user]);

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (!search.trim()) return setResults([]);

    const t = setTimeout(async () => {
      try {
        const res = await API.get(`/users/search?q=${search}`);
        setResults(res.data);
      } catch {
        toast.error("Search failed");
      }
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x._id === u._id)
        ? prev.filter((x) => x._id !== u._id)
        : [...prev, u]
    );
  };

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
      setResults([]);

      navigate(`/group/${res.data.group._id}`);
    } catch {
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">

      {/* SIDEBAR */}
      <div className="w-full md:w-1/3 border-r bg-white">

        <div className="p-3 flex justify-between items-center border-b">
          <h2 className="font-bold">Chats</h2>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm"
          >
            + Group
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-60px)]">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
            >
              {u.name}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat
      </div>

      {/* MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3">

          <div className="bg-white w-full max-w-sm md:max-w-md rounded-lg p-4 space-y-3">

            <h3 className="font-semibold text-lg">Create Group</h3>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full border p-2 rounded"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="w-full border p-2 rounded"
            />

            {/* RESULTS */}
            <div className="max-h-40 overflow-y-auto border rounded">
              {results.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedUsers.some((s) => s._id === u._id)}
                  />
                  <span className="text-sm">{u.name}</span>
                </div>
              ))}
            </div>

            {/* SELECTED */}
            <div className="flex flex-wrap gap-1">
              {selectedUsers.map((u) => (
                <span
                  key={u._id}
                  className="text-xs bg-blue-100 px-2 py-1 rounded"
                >
                  {u.name}
                </span>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={createGroup}
                className="bg-blue-500 text-white px-3 py-1 rounded"
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