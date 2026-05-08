import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import ChatHeader from "../hook/ChatHeader";
import GroupHeader from "../hook/GroupHeader";

import useGroupSocket from "../hook/useGroupSocket";
import { useMessages } from "../hook/useMessages";
import { useChatSocket } from "../hook/useChatSocket";
import { API } from "../features/Api";

export default function ChatPage() {
  const { chatUserId, groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  /* ================= DATA ================= */
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  /* ================= GROUP CREATION ================= */
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  /* ================= LOAD USERS + GROUPS ================= */
  useEffect(() => {
    const load = async () => {
      const [uRes, gRes] = await Promise.all([
        API.get("/users"),
        API.get("/group"),
      ]);

      setUsers(uRes.data.users || []);
      setGroups(gRes.data.groups || []);
    };

    load();
  }, []);

  /* ================= FILTER USERS ================= */
  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= TOGGLE USERS FOR GROUP ================= */
  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x._id === u._id)
        ? prev.filter((x) => x._id !== u._id)
        : [...prev, u]
    );
  };

  /* ================= CREATE GROUP ================= */
  const createGroup = async () => {
    if (!groupName.trim()) return;

    const res = await API.post("/group", {
      name: groupName,
      members: selectedUsers.map((u) => u._id),
    });

    setShowCreate(false);
    setGroupName("");
    setSelectedUsers([]);

    navigate(`/group/${res.data.group._id}`);
  };

  /* ================= USER CHAT ================= */
  const userChat = useMessages(chatUserId);

  useChatSocket({
    userId: user?._id,
    chatUserId,
    setMessages: userChat.setMessages,
  });

  /* ================= GROUP CHAT ================= */
  const groupChat = useGroupSocket({
    groupId,
    user,
    token: localStorage.getItem("token"),
  });

  const isGroup = !!groupId;

  const selectedUser = users.find((u) => u._id === chatUserId);
  const selectedGroup = groups.find((g) => g._id === groupId);

  return (
    <div className="h-screen flex bg-gray-100">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-[320px] bg-white border-r overflow-y-auto">

        {/* CREATE GROUP BUTTON */}
        <div className="p-3 border-b">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            + Create Group
          </button>
        </div>

        {/* USERS LIST */}
        <div className="p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full border p-2 rounded mb-3"
          />

          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white overflow-hidden">
                {u.avatar ? (
                  <img src={u.avatar} className="w-full h-full object-cover" />
                ) : (
                  u.name?.charAt(0)
                )}
              </div>

              <span className="text-sm">{u.name}</span>
            </div>
          ))}
        </div>

        {/* GROUPS LIST */}
        <div className="p-3 border-t">
          {groups.map((g) => (
            <div
              key={g._id}
              onClick={() => navigate(`/group/${g._id}`)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                {g.name?.charAt(0)}
              </div>

              <span className="text-sm">{g.name}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ================= CHAT AREA ================= */}
      <main className="flex-1 flex flex-col">

        {/* GROUP CHAT */}
        {isGroup ? (
          <>
            <GroupHeader
              group={selectedGroup}
              onlineMembers={groupChat.onlineMembers}
              onAddMembers={() => setShowCreate(true)}
            />

            <MessageList
              messages={groupChat.messages}
              userId={user._id}
            />

            <ChatInput
              onSend={groupChat.sendMessage}
              typingUser={groupChat.typingUser}
            />
          </>
        ) : chatUserId ? (
          <>
            <ChatHeader chatUser={selectedUser} />

            <MessageList
              messages={userChat.messages}
              userId={user._id}
            />

            <ChatInput onSend={userChat.sendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a user or group
          </div>
        )}
      </main>

      {/* ================= CREATE GROUP MODAL ================= */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl w-[400px]">

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full border p-2 mb-3"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="w-full border p-2 mb-3"
            />

            <div className="max-h-60 overflow-y-auto">
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!selectedUsers.find((x) => x._id === u._id)}
                    readOnly
                  />
                  {u.name}
                </div>
              ))}
            </div>

            <button
              onClick={createGroup}
              className="w-full bg-blue-500 text-white p-2 mt-3 rounded"
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}