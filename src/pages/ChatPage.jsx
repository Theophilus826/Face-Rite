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

  /* ================= GROUP ROUTE ================= */
  if (groupId) return <GroupChatPage />;

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [mobileSidebar, setMobileSidebar] = useState(true);

  const [chatText, setChatText] = useState("");

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

  /* ================= LOAD GROUPS ================= */
  useEffect(() => {
    if (!user) return;

    API.get("/group")
      .then(({ data }) => setGroups(data.groups || []))
      .catch(() => toast.error("Failed to load groups"));
  }, [user]);

  /* ================= FILTER USERS ================= */
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    return users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  const selectedUser = users.find((u) => u._id === chatUserId);

  /* ================= CHAT STREAM ================= */
  useEffect(() => {
    if (!user || !chatUserId) return;

    eventSourceRef.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/chat/stream/${user._id}/${chatUserId}`
    );

    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "init") setMessages(data.messages || []);
      if (data.type === "new_message") {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    return () => es.close();
  }, [user, chatUserId]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!chatText.trim()) return;

    const text = chatText.trim();
    setChatText("");

    try {
      await API.post("/chat/messages", {
        toUserId: chatUserId,
        text,
      });
    } catch {
      toast.error("Send failed");
    }
  };

  /* ================= RECORD VOICE ================= */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setRecording(true);
      setRecordTime(0);
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
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

  /* ================= GROUP CREATE ================= */
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

      navigate(`/group/${res.data.group._id}`);
    } catch {
      toast.error("Failed to create group");
    }
  };

  if (!user) return <div className="p-5">Login required</div>;

  return (
    <div className="h-screen flex bg-black text-white">

      {/* ================= SIDEBAR ================= */}
      <aside className={`w-full md:w-[360px] border-r border-white/10 flex flex-col ${mobileSidebar ? "block" : "hidden md:flex"}`}>

        {/* HEADER */}
        <div className="p-4 flex justify-between border-b border-white/10">
          <h1 className="font-bold text-xl">Chats</h1>
          <button onClick={() => setShowCreate(true)} className="px-3 py-1 bg-blue-600 rounded">
            + Group
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-white/10">
          <button onClick={() => setActiveTab("users")} className={`flex-1 p-2 ${activeTab === "users" ? "bg-white/10" : ""}`}>Users</button>
          <button onClick={() => setActiveTab("groups")} className={`flex-1 p-2 ${activeTab === "groups" ? "bg-white/10" : ""}`}>Groups</button>
        </div>

        {/* SEARCH */}
        <div className="p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full p-2 bg-white/10 rounded"
          />
        </div>

        {/* USERS */}
        {activeTab === "users" && (
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map((u) => (
              <div key={u._id} onClick={() => navigate(`/chat/${u._id}`)} className="p-3 hover:bg-white/10 cursor-pointer">
                {u.name}
              </div>
            ))}
          </div>
        )}

        {/* GROUPS */}
        {activeTab === "groups" && (
          <div className="flex-1 overflow-y-auto">
            {groups.map((g) => (
              <div key={g._id} onClick={() => navigate(`/group/${g._id}`)} className="p-3 hover:bg-white/10 cursor-pointer">
                {g.name}
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ================= CHAT ================= */}
      <main className="flex-1 flex flex-col">

        {!chatUserId ? (
          <div className="flex-1 flex items-center justify-center">
            Select a chat
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="p-3 border-b border-white/10">
              Chat with {selectedUser?.name || "User"}
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m._id} className="mb-2">
                  {m.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 flex gap-2 border-t border-white/10">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                className="flex-1 p-2 bg-white/10 rounded"
              />

              <button onClick={sendMessage} className="px-4 bg-blue-600 rounded">Send</button>
              <button onClick={startRecording}>🎤</button>
            </div>

            {recording && (
              <div className="p-2 text-red-400">
                Recording... {recordTime}s
                <button onClick={stopRecording} className="ml-3">Stop</button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= CREATE GROUP MODAL ================= */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 p-5 rounded w-[90%] md:w-[400px]">

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full p-2 mb-3 bg-white/10"
            />

            <button onClick={createGroup} className="w-full bg-blue-600 p-2">
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
