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

  /* ================= LISTS ================= */
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

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

  /* ================= RENDER MODE ================= */
  const isGroup = !!groupId;

  const selectedUser = users.find((u) => u._id === chatUserId);
  const selectedGroup = groups.find((g) => g._id === groupId);

  return (
    <div className="h-screen flex bg-gray-100">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-[320px] bg-white border-r overflow-y-auto">

        {/* USERS */}
        <div className="p-3">
          <h2 className="text-xs font-bold text-gray-500 mb-2">
            USERS
          </h2>

          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white">
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

        {/* GROUPS */}
        <div className="p-3 border-t">
          <h2 className="text-xs font-bold text-gray-500 mb-2">
            GROUPS
          </h2>

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

        {/* ================= GROUP CHAT ================= */}
        {isGroup ? (
          <>
            <GroupHeader group={selectedGroup} onlineMembers={groupChat.onlineMembers} />

            <MessageList
              messages={groupChat.messages}
              userId={user._id}
            />

            <ChatInput onSend={groupChat.sendMessage} typingUser={groupChat.typingUser} />
          </>
        ) : chatUserId ? (
          /* ================= USER CHAT ================= */
          <>
            <ChatHeader chatUser={selectedUser} />

            <MessageList
              messages={userChat.messages}
              userId={user._id}
            />

            <ChatInput onSend={userChat.sendMessage} />
          </>
        ) : (
          /* ================= EMPTY STATE ================= */
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a user or group to start chatting
          </div>
        )}
      </main>
    </div>
  );
}