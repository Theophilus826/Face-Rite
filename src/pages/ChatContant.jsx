import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Plus } from "lucide-react";
import { API } from "../features/Api";
import ChatPage from "./ChatPage";
import GroupChatPage from "./GroupChatPage";

function ChatContant() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [search, setSearch] = useState("");

  /* ================= CREATE GROUP ================= */
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [uRes, gRes] = await Promise.all([
          API.get("/users"),
          API.get("/group"),
        ]);

        setUsers(uRes.data.users || []);
        setGroups(gRes.data.groups || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, []);

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [groups, search]);

  /* ================= TOGGLE USER ================= */
  const toggleUser = (user) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  /* ================= CREATE GROUP ================= */
  const createGroup = async () => {
    try {
      if (!groupName.trim()) return;

      const res = await API.post("/group", {
        name: groupName,
        members: selectedUsers.map((u) => u._id),
      });

      const newGroup = res.data.group;

      setGroups((prev) => [newGroup, ...prev]);

      setGroupName("");
      setSelectedUsers([]);
      setShowCreate(false);

      navigate(`/group/${newGroup._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* ================= HEADER ================= */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Chats
        </h1>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          Create Group
        </button>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
          <Search size={18} className="text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users or groups..."
            className="w-full outline-none bg-transparent"
          />
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-y-auto">

        {/* ================= USERS ================= */}
        <div className="p-4">
          <h2 className="text-sm font-bold text-gray-500 mb-3">
            USERS
          </h2>

          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                onClick={() => navigate(`/chat/${u._id}`)}
                className="flex items-center gap-3 bg-white hover:bg-gray-50 p-3 rounded-xl cursor-pointer shadow-sm"
              >
                {/* AVATAR */}
                <div className="w-12 h-12 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-white font-bold">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    u.name?.charAt(0)
                  )}
                </div>

                {/* INFO */}
                <div>
                  <p className="font-medium text-sm">
                    {u.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    Tap to chat
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= GROUPS ================= */}
        <div className="p-4 border-t">
          <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
            <Users size={16} />
            GROUPS
          </h2>

          <div className="space-y-2">
            {filteredGroups.map((g) => (
              <div
                key={g._id}
                onClick={() => navigate(`/group/${g._id}`)}
                className="flex items-center gap-3 bg-white hover:bg-gray-50 p-3 rounded-xl cursor-pointer shadow-sm"
              >
                {/* GROUP AVATAR */}
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  {g.name?.charAt(0)}
                </div>

                {/* INFO */}
                <div>
                  <p className="font-medium text-sm">
                    {g.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {g.members?.length || 0} members
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= CREATE GROUP MODAL ================= */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[400px] rounded-2xl p-5">

            <h2 className="text-lg font-bold mb-4">
              Create Group
            </h2>

            {/* GROUP NAME */}
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full border rounded-lg p-3 mb-4"
            />

            {/* USER SEARCH */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full border rounded-lg p-3 mb-4"
            />

            {/* USER LIST */}
            <div className="max-h-60 overflow-y-auto border rounded-lg">

              {filteredUsers.map((u) => {
                const checked = selectedUsers.find(
                  (x) => x._id === u._id
                );

                return (
                  <div
                    key={u._id}
                    onClick={() => toggleUser(u)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <input
                      type="checkbox"
                      checked={!!checked}
                      readOnly
                    />

                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white overflow-hidden">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        u.name?.charAt(0)
                      )}
                    </div>

                    <span className="text-sm">
                      {u.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 mt-4">

              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 border rounded-lg py-2"
              >
                Cancel
              </button>

              <button
                onClick={createGroup}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2"
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

export default ChatContant;
