import { useEffect, useState, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

import GroupChatPage from "./GroupChatPage";

export default function ChatPage() {
  const { chatUserId, groupId } = useParams();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  /* ================= GROUP ================= */
  if (groupId) return <GroupChatPage />;

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [search, setSearch] = useState("");

  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const BASE_URL = API.defaults.baseURL.replace("/api", "");

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          API.get("/users"),
          API.get("/group"),
        ]);

        // USERS
        const formattedUsers = (usersRes.data.users || []).map((u) => ({
          ...u,
          avatar: u.avatar
            ? u.avatar.startsWith("http")
              ? u.avatar
              : `${BASE_URL}/${u.avatar}`
            : null,
        }));

        setUsers(formattedUsers);

        // GROUPS
        setGroups(groupsRes.data.groups || []);
      } catch (err) {
        console.error("Load users/groups error:", err);
        toast.error("Failed to load users or groups");
      }
    };

    fetchData();
  }, [user, BASE_URL]);

  /* ================= FILTER USERS ================= */
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;

    return users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, users]);

  const selectedUser = users.find((u) => u._id === chatUserId);

  /* ================= LOAD CHAT ================= */
  useEffect(() => {
    if (!user || !chatUserId) return;

    eventSourceRef.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/chat/stream/${user._id}/${chatUserId}`,
    );

    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.type) {
        case "init":
          setMessages(data.messages || []);
          break;

        case "new_message":
          setMessages((prev) => [...prev, data.message]);
          break;

        default:
          break;
      }
    };

    return () => es.close();
  }, [user, chatUserId]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!chatText.trim()) return;

    const text = chatText.trim();

    setChatText("");

    const temp = {
      _id: Date.now(),
      fromUser: user._id,
      toUser: chatUserId,
      text,
      type: "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);

    try {
      await API.post("/chat/messages", {
        toUserId: chatUserId,
        text,
      });
    } catch {
      toast.error("Send failed");
    }
  };

  /* ================= RECORD ================= */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      setRecording(true);
      setRecordTime(0);

      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.start();

      timerRef.current = setInterval(() => {
        setRecordTime((p) => p + 1);
      }, 1000);
    } catch {
      toast.error("Mic error");
    }
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) return;

    recorder.stop();

    clearInterval(timerRef.current);

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const formData = new FormData();

      formData.append("audio", blob);
      formData.append("toUserId", chatUserId);
      formData.append("duration", recordTime);

      setRecording(false);
      setRecordTime(0);

      try {
        await API.post("/chat/messages/voice", formData);
      } catch {
        toast.error("Voice failed");
      }
    };
  };

  /* ================= TOGGLE GROUP USER ================= */
  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x._id === u._id)
        ? prev.filter((x) => x._id !== u._id)
        : [...prev, u],
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
    } catch {
      toast.error("Failed to create group");
    }
  };

  if (!user) {
    return <div className="text-center mt-10">Login required</div>;
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-transparent text-white flex backdrop-blur-2xl">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-full md:w-[340px] border-r border-white/10 bg-white/5 backdrop-blur-3xl flex flex-col">
        {/* TOP */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wide">Messages</h1>

            <p className="text-xs text-gray-400">Connect with friends</p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-white/10 hover:bg-white/20 transition-all duration-300 px-4 py-2 rounded-2xl border border-white/10 text-sm"
          >
            + Group
          </button>
        </div>

        {/* SEARCH */}
        <div className="p-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="bg-transparent outline-none w-full text-sm placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* USERS */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 mb-1
            ${
              u._id === chatUserId
                ? "bg-white/15 border border-white/10"
                : "hover:bg-white/5"
            }`}
            >
              {/* AVATAR */}
              <div className="relative">
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-semibold text-lg">
                    {u.name?.charAt(0)}
                  </div>
                )}

                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
              </div>

              {/* USER INFO */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{u.name}</h3>

                  <span className="text-[10px] text-gray-500">now</span>
                </div>

                <p className="text-sm text-gray-400 truncate">Tap to chat</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ================= CHAT ================= */}
      <main className="flex-1 flex flex-col bg-white/[0.03] backdrop-blur-3xl">
        {!chatUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-5xl mb-6">
              💬
            </div>

            <h2 className="text-2xl font-semibold mb-2">Your Messages</h2>

            <p className="text-gray-400 max-w-sm">
              Select a conversation and start chatting instantly.
            </p>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.03] backdrop-blur-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedUser?.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    {selectedUser?.name?.charAt(0)}
                  </div>
                )}

                <div>
                  <h2 className="font-semibold text-lg">
                    {selectedUser?.name}
                  </h2>

                  <p className="text-sm text-green-400">Online</p>
                </div>
              </div>

              <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all">
                View Profile
              </button>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {messages.map((msg) => {
                const mine = msg.fromUser === user._id;

                return (
                  <div
                    key={msg._id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-3xl backdrop-blur-xl border
                    ${
                      mine
                        ? "bg-blue-500/20 border-blue-400/20 rounded-br-md"
                        : "bg-white/5 border-white/10 rounded-bl-md"
                    }`}
                    >
                      {msg.type === "voice" && msg.audio ? (
                        <audio
                          controls
                          src={msg.audio}
                          className="max-w-full"
                        />
                      ) : msg.type === "image" ? (
                        <img
                          src={msg.image}
                          alt=""
                          className="rounded-2xl max-w-xs"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      )}

                      <div className="mt-1 text-[10px] text-gray-400 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 border-t border-white/10 bg-white/[0.03] backdrop-blur-3xl">
              {!recording ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-3">
                    <input
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Write a message..."
                      className="flex-1 bg-transparent outline-none placeholder:text-gray-500"
                    />

                    <button className="text-gray-400 hover:text-white transition">
                      😊
                    </button>
                  </div>

                  {/* MIC */}
                  <button
                    onClick={startRecording}
                    className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 flex items-center justify-center transition-all"
                  >
                    🎤
                  </button>

                  {/* SEND */}
                  <button
                    onClick={sendMessage}
                    className="px-6 h-12 rounded-full bg-blue-500 hover:bg-blue-600 transition-all font-medium shadow-lg shadow-blue-500/20"
                  >
                    Send
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />

                    <p className="text-red-300">Recording... {recordTime}s</p>
                  </div>

                  <button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl transition-all"
                  >
                    Stop
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ================= CREATE GROUP MODAL ================= */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-3xl p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold">Create Group</h2>

                <p className="text-sm text-gray-400">
                  Start a group conversation
                </p>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                className="w-10 h-10 rounded-full hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>

            {/* INPUT */}
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none mb-4"
            />

            {/* USERS */}
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all
                ${
                  selectedUsers.some((s) => s._id === u._id)
                    ? "bg-blue-500/20 border border-blue-500/20"
                    : "bg-white/5 hover:bg-white/10"
                }`}
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      {u.name?.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <p>{u.name}</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={selectedUsers.some((s) => s._id === u._id)}
                    readOnly
                  />
                </div>
              ))}
            </div>

            {/* SELECTED */}
            <div className="flex flex-wrap gap-2 mb-5">
              {selectedUsers.map((u) => (
                <span
                  key={u._id}
                  className="bg-blue-500/20 border border-blue-500/20 px-3 py-1 rounded-full text-xs"
                >
                  {u.name}
                </span>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>

              <button
                onClick={createGroup}
                className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
