// pages/ChatPage.jsx
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export default function ChatPage() {
  const { chatUserId } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("offline");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const eventSourceRef = useRef(null);

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
          if (parsed.userId === chatUserId) setOnlineStatus(parsed.status);
          break;
        default:
          break;
      }
    };

    return () => es.close();
  }, [user, chatUserId]);

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
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold mb-2">
        Chat with {chatUserId} <span className={`text-sm ${onlineStatus === "online" ? "text-green-600" : "text-gray-400"}`}>({onlineStatus})</span>
      </h2>
      {isTyping && <p className="text-sm text-gray-500 mb-1">{chatUserId} is typing...</p>}

      <div className="h-96 overflow-y-auto border rounded p-2 mb-2 flex flex-col gap-1">
        {messages.map((msg, idx) => (
          <div key={idx} className={`p-2 rounded ${msg.fromUser === user._id ? "bg-blue-200 self-end text-right" : "bg-gray-200 self-start text-left"}`}>
            {msg.type === "voice" ? <audio controls src={msg.audio} /> : msg.text || msg.message}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Type a message..."
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={sendMessage}>Send</button>
      </div>

      <div className="flex gap-2">
        {!recording ? (
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={startRecording}>🎤 Record</button>
        ) : (
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={stopRecording}>🛑 Stop</button>
        )}
      </div>
    </div>
  );
}