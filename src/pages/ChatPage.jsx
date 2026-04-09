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
        const { data } = await API.get("/users", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const initializedUsers = data.users.map((u) => ({
          ...u,
          status: "offline",
        }));
        setUsers(initializedUsers);
      } catch (err) {
        console.error("Failed to fetch users", err.response?.data || err.message);
      }
    };
    fetchUsers();
  }, [user]);

  /* ================= SSE Chat ================= */
  useEffect(() => {
    if (!user || !chatUserId) return;

    // Close previous EventSource if exists
    if (eventSourceRef.current) eventSourceRef.current.close();

    const es = new EventSource(
      `${API.defaults.baseURL.replace("/api", "")}/chat/stream/${user._id}/${chatUserId}`
    );
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const parsed = JSON.parse(e.data);

      switch (parsed.type) {
        case "init":
          setMessages(parsed.messages || []);
          break;

        case "new_message":
          // Avoid duplicating own messages
          if (parsed.message.fromUser !== user._id) {
            setMessages((prev) => [...prev, parsed.message]);
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
              u._id === parsed.userId ? { ...u, status: parsed.status } : u
            )
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

    const text = chatText.trim();
    setChatText(""); // clear input immediately

    // Optimistic UI
    const tempMessage = {
      fromUser: user._id,
      toUser: chatUserId,
      text,
      type: "text",
      status: "sent",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await API.post(
        "/chat/send",
        { toUserId: chatUserId, text },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      await API.post(
        "/chat/stop-typing",
        { toUserId: chatUserId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      console.error("Send failed:", err);
      toast.error("Failed to send message");
      // remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m !== tempMessage));
    }
  };

  /* ================= Typing ================= */
  useEffect(() => {
    if (!chatText.trim()) return;

    const timeout = setTimeout(async () => {
      try {
        await API.post(
          "/chat/typing",
          { toUserId: chatUserId },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
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

      setRecording(false);

      try {
        await API.post("/chat/voice", formData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } catch (err) {
        console.error("Voice upload failed", err);
        toast.error("Failed to send voice note");
      }
    };
  };

  if (!user) {
    return (
      <div className="text-center mt-10 text-gray-500">
        Please log in to view this chat.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-sm">
      {/* ================= User List ================= */}
      <div className="flex gap-4 overflow-x-auto border-b p-2 bg-gray-50">
        {users.map((u) => (
          <div
            key={u._id}
            className={`flex items-center gap-1 cursor-pointer px-3 py-1 rounded-full transition-colors ${
              u._id === chatUserId ? "bg-blue-100 font-semibold" : "hover:bg-gray-100"
            }`}
            onClick={() => navigate(`/chat/${u._id}`)}
          >
            <span
              className={`w-3 h-3 rounded-full ${
                u.status === "online" ? "bg-green-500" : "bg-gray-400"
              }`}
            ></span>
            <span className="text-sm">{u.name}</span>
          </div>
        ))}
      </div>

      {/* ================= Chat Header ================= */}
      <div className="flex-shrink-0 px-4 py-2 border-b flex flex-col">
        <h2 className="text-2xl font-semibold">
          Chat with {chatUserId}{" "}
          <span
            className={`text-sm ${
              onlineStatus === "online" ? "text-green-600" : "text-gray-400"
            }`}
          >
            ({onlineStatus})
          </span>
        </h2>
        {isTyping && <p className="text-sm text-gray-500">{chatUserId} is typing...</p>}
      </div>

      {/* ================= Messages ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded max-w-[70%] break-words ${
              msg.fromUser === user._id
                ? "bg-blue-200 self-end text-right"
                : "bg-gray-200 self-start text-left"
            }`}
          >
            {msg.type === "voice" ? (
              <audio controls src={msg.audio} className="w-full" />
            ) : (
              msg.text || msg.message
            )}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* ================= Input Area ================= */}
      <div className="flex-shrink-0 bg-white p-2 border-t fixed bottom-0 left-0 w-full max-w-3xl flex gap-2 z-50 md:relative md:w-full">
        <input
          type="text"
          className="flex-1 border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type a message..."
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={sendMessage}
        >
          Send
        </button>
        {!recording ? (
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            onClick={startRecording}
          >
            🎤
          </button>
        ) : (
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={stopRecording}
          >
            🛑
          </button>
        )}
      </div>

      {/* Padding for mobile input */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
}