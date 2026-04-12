// pages/ChatPage.jsx
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export default function ChatPage() {
  const { chatUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("offline");

  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const eventSourceRef = useRef(null);
  const messagesEndRef = useRef(null);

  const BASE_URL = API.defaults.baseURL.replace("/api", "");

  const selectedUser = users.find((u) => u._id === chatUserId);

  /* ================= HELPERS ================= */
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatRecordTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        const { data } = await API.get("/users");

        const formatted = data.users.map((u) => ({
          ...u,
          status: "offline",
          avatar: u.avatar
            ? u.avatar.startsWith("http")
              ? u.avatar
              : `${BASE_URL}/${u.avatar}`
            : null,
        }));

        setUsers(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUsers();
  }, [user]);

  /* ================= SSE ================= */
  useEffect(() => {
    if (!user || !chatUserId) return;

    if (eventSourceRef.current) eventSourceRef.current.close();

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
          if (data.message.fromUser !== user._id) {
            setMessages((prev) => [...prev, data.message]);
          }
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
              u._id === data.userId ? { ...u, status: data.status } : u,
            ),
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

  /* ================= SEND TEXT ================= */
  const sendMessage = async () => {
    if (!chatText.trim()) return;

    const text = chatText.trim();
    setChatText("");

    const temp = {
      fromUser: user._id,
      toUser: chatUserId,
      text,
      type: "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);

    try {
      await API.post("/chat/send", { toUserId: chatUserId, text });
      await API.post("/chat/stop-typing", { toUserId: chatUserId });
    } catch {
      toast.error("Send failed");
    }
  };

  /* ================= SEND IMAGE ================= */
  const sendImage = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("toUserId", chatUserId);

    try {
      await API.post("/chat/image", formData);
      setSelectedImage(null);
    } catch {
      toast.error("Image failed");
    }
  };

  /* ================= TYPING ================= */
  useEffect(() => {
    if (!chatText.trim()) return;

    const t = setTimeout(() => {
      API.post("/chat/typing", { toUserId: chatUserId }).catch(() => {});
    }, 300);

    return () => clearTimeout(t);
  }, [chatText]);

  /* ================= VOICE ================= */
  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      return toast.error("Audio not supported");
    }

    setRecording(true);
    setRecordTime(0);
    audioChunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) =>
      audioChunksRef.current.push(e.data);

    mediaRecorderRef.current.start();

    timerRef.current = setInterval(() => {
      setRecordTime((p) => p + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    clearInterval(timerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("audio", blob);
      formData.append("toUserId", chatUserId);

      setRecording(false);
      setRecordTime(0);

      try {
        await API.post("/chat/voice", formData);
      } catch {
        toast.error("Voice failed");
      }
    };
  };

  if (!user) return <div className="text-center mt-10">Login required</div>;

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* USERS */}
      <div className="flex gap-4 overflow-x-auto p-2 border-b bg-gray-50">
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => navigate(`/chat/${u._id}`)}
            className={`
        flex flex-col items-center justify-center
        min-w-[70px] sm:min-w-[80px]
        cursor-pointer rounded-xl p-2
        ${u._id === chatUserId ? "bg-blue-100" : "hover:bg-gray-100"}
      `}
          >
            {/* AVATAR */}
            <div className="relative">
              {u.avatar ? (
                <img
                  src={u.avatar}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 text-white flex items-center justify-center rounded-full">
                  {u.name?.charAt(0)}
                </div>
              )}

              {/* ONLINE DOT */}
              <span
                className={`
            absolute bottom-0 right-0 
            w-2.5 h-2.5 rounded-full border border-white
            ${u.status === "online" ? "bg-green-500" : "bg-gray-400"}
          `}
              />
            </div>

            {/* USERNAME UNDER AVATAR */}
            <span className="text-xs sm:text-sm mt-1 text-center truncate w-full">
              {u.name}
            </span>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-2 border-b">
        <p className="font-semibold">{selectedUser?.name}</p>
        <span className="text-xs text-gray-500">
          {isTyping ? "typing..." : onlineStatus}
        </span>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col max-w-[80%] ${
              msg.fromUser === user._id ? "self-end items-end" : "self-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-2xl ${
                msg.fromUser === user._id
                  ? "bg-blue-500 text-white"
                  : "bg-white border"
              }`}
            >
              {msg.type === "image" ? (
                <img src={msg.image} className="rounded max-w-xs" />
              ) : msg.type === "voice" ? (
                <audio controls src={msg.audio} />
              ) : (
                msg.text
              )}
            </div>

            <span className="text-[10px] text-gray-500 mt-1">
              {formatTime(msg.createdAt)}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t pb-24 flex gap-2 items-center z-50 sm:static sm:border-none">
        <input
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          placeholder="Type message..."
          className="flex-1 border rounded p-2 text-sm sm:text-base"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          Send
        </button>

        {!recording ? (
          <button onClick={startRecording}>🎤</button>
        ) : (
          <button onClick={stopRecording}>🛑</button>
        )}
      </div>
    </div>
  );
}
