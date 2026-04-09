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
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("offline");
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const eventSourceRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* ================= Fetch Users ================= */
  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      try {
        const { data } = await API.get("/users", { headers: { Authorization: `Bearer ${user.token}` } });
        const initializedUsers = data.users.map(u => ({ ...u, status: "offline" }));
        setUsers(initializedUsers);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, [user]);

  /* ================= SSE Chat ================= */
  useEffect(() => {
    if (!user || !chatUserId) return;

    const es = new EventSource(`${API.defaults.baseURL}/chat/stream/${user._id}/${chatUserId}`, { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const parsed = JSON.parse(e.data);
      switch (parsed.type) {
        case "init":
          setMessages(parsed.messages || []);
          break;
        case "new_message":
          setMessages((prev) => [...prev, parsed.message]);
          break;
        case "typing":
          setIsTyping(true);
          break;
        case "stop_typing":
          setIsTyping(false);
          break;
        case "status":
          setUsers((prev) =>
            prev.map((u) => (u._id === parsed.userId ? { ...u, status: parsed.status } : u))
          );
          if (parsed.userId === chatUserId) setOnlineStatus(parsed.status);
          break;
        default:
          break;
      }
    };

    return () => es.close();
  }, [user, chatUserId]);

  /* ================= Auto Scroll to Bottom ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= Send Message ================= */
  const sendMessage = async () => {
    if (!chatText.trim()) return;
    try {
      const { data } = await API.post(
        "/chat/send",
        { toUserId: chatUserId, text: chatText },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessages((prev) => [...prev, data.message]);
      setChatText("");
      await API.post("/chat/stop-typing", { toUserId: chatUserId }, { headers: { Authorization: `Bearer ${user.token}` } });
    } catch (err) {
      console.error("Send failed:", err);
      toast.error("Failed to send message");
    }
  };

  /* ================= Typing ================= */
  useEffect(() => {
    if (!chatText.trim()) return;
    const timeout = setTimeout(async () => {
      try {
        await API.post("/chat/typing", { toUserId: chatUserId }, { headers: { Authorization: `Bearer ${user.token}` } });
      } catch {}
    }, 300);
    return () => clearTimeout(timeout);
  }, [chatText]);

  /* ================= Voice Recording ================= */
  const startRecording = async () => {
    if (!navigator.mediaDevices) return toast.error("Audio recording not supported");
    setRecording(true);
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorderRef.current.start();
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob);
      formData.append("toUserId", chatUserId);
      try {
        const { data } = await API.post("/chat/voice", formData, { headers: { Authorization: `Bearer ${user.token}` } });
        setMessages((prev) => [...prev, data.message]);
      } catch (err) {
        console.error("Voice upload failed", err);
        toast.error("Failed to send voice note");
      }
      setRecording(false);
    };
  };

  if (!user) return <div className="text-center mt-10 text-muted">Please log in to view this chat.</div>;

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* ================= User List ================= */}
      <div className="flex gap-4 overflow-x-auto border-b p-2">
        {users.map((u) => (
          <div
            key={u._id}
            className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded transition-colors ${
              u._id === chatUserId ? "bg-blue-100 font-semibold" : "hover:bg-gray-100"
            }`}
            onClick={() => navigate(`/chat/${u._id}`)}
          >
            <span
              className={`w-3 h-3 rounded-full ${u.status === "online" ? "bg-green-500" : "bg-purple-500"}`}
            ></span>
            <span className="text-sm">{u.name}</span>
          </div>
        ))}
      </div>

      {/* ================= Chat Header ================= */}
      <div className="flex-shrink-0 px-4 py-2 border-b">
        <h2 className="text-2xl font-semibold">
          Chat with {chatUserId}{" "}
          <span className={`text-sm ${onlineStatus === "online" ? "text-green-600" : "text-gray-400"}`}>
            ({onlineStatus})
          </span>
        </h2>
        {isTyping && <p className="text-sm text-gray-500">{chatUserId} is typing...</p>}
      </div>

      {/* ================= Messages ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded max-w-[70%] ${
              msg.fromUser === user._id ? "bg-blue-200 self-end text-right" : "bg-gray-200 self-start text-left"
            }`}
          >
            {msg.type === "voice" ? <audio controls src={msg.audio} /> : msg.text || msg.message}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* ================= Input Area ================= */}
      <div className="flex-shrink-0 bg-white p-2 border-t fixed bottom-0 left-0 w-full max-w-3xl flex gap-2 z-50 md:relative md:w-full">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Type a message..."
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={sendMessage}>
          Send
        </button>
        {!recording ? (
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={startRecording}>
            🎤
          </button>
        ) : (
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={stopRecording}>
            🛑
          </button>
        )}
      </div>

      {/* Padding bottom for mobile to avoid input overlay */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
}