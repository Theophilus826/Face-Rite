import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { Search, Users, Plus, Coins, UserPlus } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { API } from "../features/Api";

function ChatContant() {
  const navigate = useNavigate();

  /* ================= DATA ================= */
  const token = localStorage.getItem("token");

  const [contacts, setContacts] = useState([]);

  const [searchUsers, setSearchUsers] = useState([]);

  const [groups, setGroups] = useState([]);

  /* ================= SEARCH ================= */

  const [globalSearch, setGlobalSearch] = useState("");

  const [groupSearch, setGroupSearch] = useState("");

  /* ================= CREATE GROUP ================= */

  const [showCreate, setShowCreate] = useState(false);

  const [groupName, setGroupName] = useState("");

  const [selectedUsers, setSelectedUsers] = useState([]);

  /* ================= REWARD ================= */

  const [showReward, setShowReward] = useState(false);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Get the logged-in user from localStorage
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    const token = storedUser?.token;

    if (!token) {
      console.warn("⚠️ No token found for Notification SSE");
      return;
    }

    const base = API.defaults.baseURL.replace(/\/$/, "");
    const url = `${base}/notifications/stream?token=${encodeURIComponent(
      token,
    )}`;

    console.log("Connecting SSE:", url);

    const es = new EventSource(url);

    es.onopen = () => {
      console.log("✅ Notifications SSE connected");
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // Ignore keep-alive messages
        if (data.type === "ping" || data.type === "connected") return;

        if (data.type === "status") {
          const { userId, status } = data;

          setContacts((prev) =>
            prev.map((u) =>
              String(u._id) === String(userId)
                ? {
                    ...u,
                    status,
                    ...(status === "offline" ? { lastActive: Date.now() } : {}),
                  }
                : u,
            ),
          );

          setSearchUsers((prev) =>
            prev.map((u) =>
              String(u._id) === String(userId)
                ? {
                    ...u,
                    status,
                    ...(status === "offline" ? { lastActive: Date.now() } : {}),
                  }
                : u,
            ),
          );
        }

        if (data.type === "notification") {
          console.log("🔔 Notification:", data.notification);
        }
      } catch (err) {
        console.error("NOTIFICATION SSE PARSE ERROR:", err);
      }
    };

    es.onerror = (err) => {
      console.error("❌ Notification SSE ERROR:", err);
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  const loadData = async () => {
    try {
      const [contactsRes, groupsRes] = await Promise.all([
        API.get("/users/contacts"),
        API.get("/group"),
      ]);

      setContacts(contactsRes.data.users || []);

      setGroups(groupsRes.data.groups || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= SEARCH USERS ================= */

  useEffect(() => {
    const delay = setTimeout(() => {
      if (globalSearch.trim()) {
        handleSearch(globalSearch);
      } else {
        setSearchUsers([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [globalSearch]);

  const handleSearch = async (q) => {
    try {
      const res = await API.get(`/users/search?q=${encodeURIComponent(q)}`);

      const me = JSON.parse(localStorage.getItem("user") || "{}");

      setSearchUsers((res.data.users || []).filter((u) => u._id !== me._id));
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= ADD CONTACT ================= */

  const addContact = async (userId) => {
    try {
      const res = await API.post("/users/contacts/add", {
        userId,
      });

      if (res.data.contact) {
        setContacts((prev) => [...prev, res.data.contact]);
      }

      setSearchUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  /* ================= FILTER CONTACTS ================= */

  const filteredContacts = useMemo(() => {
    const q = globalSearch.toLowerCase().trim();

    return contacts.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.phone?.includes(globalSearch.trim()),
    );
  }, [contacts, globalSearch]);

  /* ================= FILTER GROUPS ================= */

  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name?.toLowerCase().includes(globalSearch.toLowerCase()),
    );
  }, [groups, globalSearch]);

  /* ================= GROUP USERS ================= */

  const modalUsers = useMemo(() => {
    return contacts.filter((u) =>
      u.name?.toLowerCase().includes(groupSearch.toLowerCase()),
    );
  }, [contacts, groupSearch]);

  /* ================= TOGGLE USER ================= */

  const toggleUser = (user) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
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

      setShowReward(true);

      setTimeout(() => {
        setShowReward(false);
      }, 3000);

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
      {/* HEADER */}

      <div className="bg-white border-b p-4 flex items-center justify-between">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1) || navigate("/home")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-xl font-bold">Chats</h1>
        </div>

        {/* RIGHT SIDE */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          <Plus size={15} />
          Create Group
        </button>
      </div>

      {/* SEARCH */}

      <div className="p-4 bg-white border-b">
        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-gray-50">
          <Search size={18} className="text-gray-400" />

          <input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search users or groups..."
            className="w-full outline-none bg-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* SEARCH RESULTS */}

        {globalSearch.trim() && searchUsers.length > 0 && (
          <div className="p-4">
            <h2 className="text-sm font-bold text-gray-500 mb-3">
              SEARCH RESULTS
            </h2>

            <div className="space-y-2">
              {searchUsers.map((u) => {
                const alreadyAdded = contacts.some((c) => c._id === u._id);

                return (
                  <div
                    key={u._id}
                    className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-white font-bold">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            u.name?.charAt(0)
                          )}
                        </div>

                        {(u.online || u.status === "online") && (
                          <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                      </div>
                    </div>

                    {!alreadyAdded && (
                      <button
                        onClick={() => addContact(u._id)}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-sm"
                      >
                        <UserPlus size={16} />
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTACTS */}

        <div className="p-4">
          <h2 className="text-sm font-bold text-gray-500 mb-3">CONTACTS</h2>

          <div className="space-y-2">
            {filteredContacts.map((u) => (
              <div
                key={u._id}
                onClick={() => navigate(`/chat/${u._id}`)}
                className="flex items-center gap-3 bg-white hover:bg-gray-50 p-3 rounded-2xl cursor-pointer shadow-sm"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-white font-bold">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      u.name?.charAt(0)
                    )}
                  </div>

                  {(u.online || u.status === "online") && (
                    <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
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

        {/* GROUPS */}

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
                className="flex items-center gap-3 bg-white hover:bg-gray-50 p-3 rounded-2xl cursor-pointer shadow-sm"
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

      {/* CREATE GROUP MODAL */}

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-[420px] rounded-3xl p-5 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Create Group</h2>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full border rounded-xl p-3 mb-4"
            />

            <input
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full border rounded-xl p-3 mb-4"
            />

            <div className="max-h-60 overflow-y-auto border rounded-xl">
              {modalUsers.map((u) => {
                const checked = selectedUsers.some((x) => x._id === u._id);

                return (
                  <div
                    key={u._id}
                    onClick={() => toggleUser(u)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <input type="checkbox" checked={checked} readOnly />

                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-white">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.name?.charAt(0)
                        )}
                      </div>

                      {(u.online || u.status === "online") && (
                        <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                      )}
                    </div>

                    <span className="text-sm">{u.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 border rounded-xl py-2"
              >
                Cancel
              </button>

              <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="flex-1 bg-blue-500 text-white rounded-xl py-2"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REWARD */}

      {showReward && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <div className="bg-yellow-400 border-4 border-yellow-300 rounded-3xl px-10 py-6 shadow-2xl">
              <div className="flex flex-col items-center">
                <Coins size={60} className="text-yellow-700 animate-spin" />

                <h1 className="text-4xl font-extrabold text-black mt-3">+50</h1>

                <p className="font-bold text-black">Coins Earned</p>

                <p className="text-sm text-gray-700 mt-1">
                  Group Creation Reward
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatContant;
