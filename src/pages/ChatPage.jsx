import { useEffect, useState, useRef } from "react";
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

  /* GROUP MODAL */
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
      const res = await API.get(`/users/search?q=${search}`);
      setResults(res.data);
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  /* ================= TOGGLE ================= */
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
      const res = await API.post("/group/create", {
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

  /* ================= UI ================= */
  return (
    <div className="flex h-screen">

      {/* USERS */}
      <div className="w-1/3 border-r">
        <div className="p-3 flex justify-between">
          <h2 className="font-bold">Chats</h2>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            + Group
          </button>
        </div>

        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => navigate(`/chat/${u._id}`)}
            className="p-3 hover:bg-gray-100 cursor-pointer"
          >
            {u.name}
          </div>
        ))}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex items-center justify-center">
        Select a chat
      </div>

      {/* MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 w-96 rounded space-y-3">

            <h3>Create Group</h3>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full border p-2"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="w-full border p-2"
            />

            <div className="max-h-40 overflow-y-auto">
              {results.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                >
                  <input type="checkbox" readOnly
                    checked={selectedUsers.some((s) => s._id === u._id)}
                  /> {u.name}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)}>Cancel</button>
              <button onClick={createGroup} className="bg-blue-500 text-white px-3">
                Create
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}