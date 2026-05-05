import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

import GroupChatPage from "./GroupChatPage";

export default function ChatPage() {
  const token = localStorage.getItem("token");
  const { chatUserId, groupId } = useParams(); // 🔥 ADD groupId
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  /* ================= MODE DETECTION ================= */
  const isGroupChat = !!groupId;

  /* ================= IF GROUP CHAT ================= */
  if (isGroupChat) {
    return <GroupChatPage />;
  }

  /* ================= DM STATE ================= */
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("offline");

  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const eventSourceRef = useRef(null);
  const notificationSourceRef = useRef(null);
  const messagesEndRef = useRef(null);
  const notifiedIdsRef = useRef(new Set());

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const timerRef = useRef(null);

  const BASE_URL = API.defaults.baseURL.replace("/api", "");
  const selectedUser = users.find((u) => u._id === chatUserId);

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    if (!user) return;

    API.get("/users")
      .then(({ data }) => {
        setUsers(
          data.users.map((u) => ({
            ...u,
            status: "offline",
            avatar: u.avatar?.startsWith("http")
              ? u.avatar
              : u.avatar
              ? `${BASE_URL}/${u.avatar}`
              : null,
          }))
        );
      })
      .catch(console.error);
  }, [user]);

  /* ================= CHAT SSE ================= */
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
          notifiedIdsRef.current.clear();
          break;

        case "new_message":
          setMessages((prev) => [...prev, data.message]);
          break;

        case "typing":
          setIsTyping(true);
          break;

        case "stop_typing":
          setIsTyping(false);
          break;

        case "status":
          setUsers((prev) =>
            prev.map((u) =>
              u._id === data.userId ? { ...u, status: data.status } : u
            )
          );

          if (data.userId === chatUserId) {
            setOnlineStatus(data.status);
          }
          break;

        default:
          break;
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
      await API.post("/chat/messages", { toUserId: chatUserId, text });
      await API.post("/chat/typing/stop", { toUserId: chatUserId });
    } catch {
      toast.error("Send failed");
    }
  };

  /* ================= VOICE ================= */
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

  if (!user) return <div className="text-center mt-10">Login required</div>;

  /* ================= UI ================= */
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-transparent">

      {/* USERS */}
      <div className="flex gap-3 overflow-x-auto p-2 border-b">
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => navigate(`/chat/${u._id}`)}
            className={`cursor-pointer p-2 rounded-xl ${
              u._id === chatUserId ? "bg-blue-100/50" : ""
            }`}
          >
            <div className="relative">
              {u.avatar ? (
                <img src={u.avatar} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full">
                  {u.name?.charAt(0)}
                </div>
              )}
            </div>

            <p className="text-xs mt-1 text-center">{u.name}</p>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="px-4 py-2 border-b flex gap-2">
        <p className="font-semibold">{selectedUser?.name}</p>
        <span className="text-xs text-gray-500">
          {isTyping ? "typing..." : onlineStatus}
        </span>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto pb-24 flex flex-col gap-2">
        {messages.map((msg) => (
          <div key={msg._id}>
            {msg.type === "voice" && msg.audio ? (
              <audio controls src={msg.audio} />
            ) : msg.type === "image" ? (
              <img src={msg.image} className="max-w-xs rounded-lg" />
            ) : (
              <p className="px-3 py-2 rounded bg-white/20 inline-block">
                {msg.text}
              </p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-2 border-t flex items-center gap-2">
        {!recording ? (
          <>
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <button onClick={sendMessage}>Send</button>
            <button onClick={startRecording}>🎤</button>
          </>
        ) : (
          <>
            <span>{recordTime}s</span>
            <button onClick={stopRecording}>🛑</button>
          </>
        )}
      </div>
    </div>
  );
}