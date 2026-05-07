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

    API.get("/users")
      .then(({ data }) => {
        setUsers(
          (data.users || []).map((u) => ({
            ...u,
            avatar: u.avatar?.startsWith("http")
              ? u.avatar
              : u.avatar
              ? `${BASE_URL}/${u.avatar}`
              : null,
          }))
        );
      })
      .catch(() => toast.error("Failed to load users"));
  }, [user]);

  /* ================= FILTER USERS ================= */
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;

    return users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  const selectedUser = users.find((u) => u._id === chatUserId);

  /* ================= LOAD CHAT ================= */
  useEffect(() => {
    if (!user || !chatUserId) return;

    eventSourceRef.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/chat/stream/${user._id}/${chatUserId}`
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
        : [...prev, u]
    );
  };

  /* ================= CREATE GROUP ================= */
  const createGroup = async () => {
    if (!groupName.trim()) return toast.error("Group name required");

    if (!selectedUsers.length)
      return toast.error("Select members");

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
    return (
      <div className="text-center mt-10">
        Login required
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">

      {/* ================= SIDEBAR ================= */}
      <div className="w-full md:w-80 border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col">

        {/* HEADER */}
        <div className="p-3 flex justify-between items-center border-b border-white/10">
          <h2 className="font-bold text-lg">Chats</h2>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm"
          >
            + Group
          </button>
        </div>

        {/* SEARCH */}
        <div className="p-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full p-2 rounded bg-white/10 border border-white/10 outline-none"
          />
        </div>

        {/* USERS */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className={`flex items-center gap-3 p-3 cursor-pointer border-b border-white/10 hover:bg-white/10 ${
                u._id === chatUserId ? "bg-white/10" : ""
              }`}
            >
              {u.avatar ? (
                <img
                  src={u.avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  {u.name?.charAt(0)}
                </div>
              )}

              <div>
                <p>{u.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="flex-1 flex flex-col">

        {!chatUserId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a user to start chatting
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-white/5">

              {selectedUser?.avatar ? (
                <img
                  src={selectedUser.avatar}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  {selectedUser?.name?.charAt(0)}
                </div>
              )}

              <div>
                <p className="font-semibold">
                  {selectedUser?.name}
                </p>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {messages.map((msg) => {
                const mine = msg.fromUser === user._id;

                return (
                  <div
                    key={msg._id}
                    className={`flex ${
                      mine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-2xl ${
                        mine
                          ? "bg-blue-500"
                          : "bg-white/10"
                      }`}
                    >
                      {msg.type === "voice" && msg.audio ? (
                        <audio controls src={msg.audio} />
                      ) : msg.type === "image" ? (
                        <img
                          src={msg.image}
                          className="rounded-lg max-w-xs"
                        />
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 border-t border-white/10 flex items-center gap-2">

              {!recording ? (
                <>
                  <input
                    value={chatText}
                    onChange={(e) =>
                      setChatText(e.target.value)
                    }
                    placeholder="Type message..."
                    className="flex-1 p-3 rounded-full bg-white/10 border border-white/10 outline-none"
                  />

                  <button
                    onClick={sendMessage}
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full"
                  >
                    Send
                  </button>

                  <button
                    onClick={startRecording}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full"
                  >
                    🎤
                  </button>
                </>
              ) : (
                <>
                  <span className="text-red-400">
                    Recording {recordTime}s
                  </span>

                  <button
                    onClick={stopRecording}
                    className="bg-red-600 px-4 py-2 rounded-full"
                  >
                    🛑 Stop
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ================= CREATE GROUP MODAL ================= */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-4 space-y-4">

            <h3 className="text-lg font-semibold">
              Create Group
            </h3>

            <input
              value={groupName}
              onChange={(e) =>
                setGroupName(e.target.value)
              }
              placeholder="Group name"
              className="w-full p-2 rounded bg-white/10 border border-white/10 outline-none"
            />

            <div className="max-h-52 overflow-y-auto border border-white/10 rounded-lg">

              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="flex items-center gap-2 p-2 hover:bg-white/10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.some(
                      (s) => s._id === u._id
                    )}
                    readOnly
                  />

                  <span>{u.name}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <span
                  key={u._id}
                  className="bg-blue-500/20 px-2 py-1 rounded text-xs"
                >
                  {u.name}
                </span>
              ))}
            </div>

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-white/10 rounded"
              >
                Cancel
              </button>

              <button
                onClick={createGroup}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
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