import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Plus } from "lucide-react";
import { API } from "../features/Api";

function ChatContant() {
  const navigate = useNavigate();

  /* ================= DATA ================= */
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  /* ================= SEARCH ================= */
  const [globalSearch, setGlobalSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

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

  /* ================= FILTER USERS ================= */
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name?.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [users, globalSearch]);

  /* ================= FILTER GROUPS ================= */
  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name?.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [groups, globalSearch]);

  /* ================= GROUP MODAL USERS ================= */
  const modalUsers = useMemo(() => {
    return users.filter((u) =>
      u.name?.toLowerCase().includes(groupSearch.toLowerCase())
    );
  }, [users, groupSearch]);

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
      if (selectedUsers.length === 0) return;

      const res = await API.post("/group", {
        name: groupName.trim(),
        members: selectedUsers.map((u) => u._id),
      });

      const newGroup = res.data.group;

      setGroups((prev) => [newGroup, ...prev]);

      // reset
      setGroupName("");
      setSelectedUsers([]);
      setGroupSearch("");
      setShowCreate(false);

      navigate(`/group/${newGroup._id}`);
    } catch (err) {
      console.error("CREATE GROUP ERROR:", err.response?.data || err.message);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* ================= HEADER ================= */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Chats</h1>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={15} />
          Create Group
        </button>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
          <Search size={18} className="text-gray-400" />

          <input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
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
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold overflow-hidden">
                  {u.avatar ? (
                    <img src={u.avatar} className="w-full h-full object-cover" />
                  ) : (
                    u.name?.charAt(0)
                  )}
                </div>

                <div>
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">Tap to chat</p>
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
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  {g.name?.charAt(0)}
                </div>

                <div>
                  <p className="font-medium text-sm">{g.name}</p>
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white w-[420px] rounded-2xl p-5">

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

            {/* SEARCH USERS */}
            <input
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full border rounded-lg p-3 mb-4"
            />

            {/* USERS LIST */}
            <div className="max-h-60 overflow-y-auto border rounded-lg">

              {modalUsers.map((u) => {
                const checked = selectedUsers.some(
                  (x) => x._id === u._id
                );

                return (
                  <div
                    key={u._id}
                    onClick={() => toggleUser(u)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <input type="checkbox" checked={checked} readOnly />

                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white overflow-hidden">
                      {u.avatar ? (
                        <img src={u.avatar} className="w-full h-full object-cover" />
                      ) : (
                        u.name?.charAt(0)
                      )}
                    </div>

                    <span className="text-sm">{u.name}</span>
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
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg py-2"
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