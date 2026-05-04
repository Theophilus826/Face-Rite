import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export default function ChatPage() {
  const token = localStorage.getItem("token");
  const { chatUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

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

  /* ================= HELPERS ================= */

  const formatRecordTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const getPreviewText = (msg) => {
    if (msg.type === "text") return msg.text;
    if (msg.type === "voice") return "🎤 Voice message";
    if (msg.type === "image") return "🖼️ Image";
    return "New message";
  };

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
          })),
        );
      })
      .catch(console.error);
  }, [user]);

  /* ================= CHAT SSE ================= */

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
          notifiedIdsRef.current.clear();
          break;

        case "new_message":
          if (!data.message?._id) return;

          setMessages((prev) => {
            const exists = prev.find((m) => m._id === data.message._id);
            if (exists) return prev;
            return [...prev, data.message];
          });

          // 🔔 show toast only if not from me
          if (
            String(data.message.fromUser) !== String(user._id) &&
            !notifiedIdsRef.current.has(data.message._id)
          ) {
            notifiedIdsRef.current.add(data.message._id);
            toast.info(`💬 ${getPreviewText(data.message)}`);
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

  /* ================= NOTIFICATION SSE ================= */

  useEffect(() => {
    if (!user) return;

    notificationSourceRef.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/notifications/stream?token=${token}`,
    );

    notificationSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "notification") {
        const notif = data.notification;

        if (!notif?._id) return;

        // 🚫 prevent duplicates
        if (notifiedIdsRef.current.has(notif._id)) return;

        notifiedIdsRef.current.add(notif._id);

        toast.info(`🔔 ${notif.message}`);
      }
    };

    return () => es.close();
  }, [user]);

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
      _id: Date.now(),
      fromUser: user._id,
      toUser: chatUserId,
      text,
      type: "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);

    try {
      // ✅ FIXED ROUTES
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

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-transparent">
      {/* USERS */}
      <div className="flex gap-3 overflow-x-auto p-2 border-b bg-transparent">
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
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${
                  u.status === "online" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>

            <p className="text-xs mt-1 text-center truncate w-full">
              {u.name || "User"}
            </p>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="px-4 py-2 border-b flex gap-2 bg-transparent">
        <p className="font-semibold">{selectedUser?.name}</p>
        <span className="text-xs text-gray-500">
          {isTyping ? "typing..." : onlineStatus}
        </span>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto pb-24 flex flex-col gap-2 bg-transparent">
        {messages.map((msg) => (
          <div key={msg._id} className="mb-2">
            {msg.type === "voice" && msg.audio?.startsWith("http") ? (
              <audio controls className="w-full max-w-xs" />
            ) : msg.type === "image" && msg.image?.startsWith("http") ? (
              <img
                src={msg.image}
                className="max-w-xs rounded-lg border"
                alt="sent media"
                loading="lazy"
              />
            ) : msg.type === "text" ? (
              <p className="px-3 py-2 rounded bg-white/20 inline-block text-black">
                {msg.text}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">Unsupported message</p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-2 border-t flex items-center gap-2 pb-24 bg-transparent">
        {!recording ? (
          <>
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              className="flex-1 border p-2 rounded bg-transparent"
            />
            <button onClick={sendMessage}>Send</button>
            <button onClick={startRecording}>🎤</button>
          </>
        ) : (
          <>
            <span>{formatRecordTime(recordTime)}</span>
            <button onClick={stopRecording}>🛑</button>
          </>
        )}
      </div>
    </div>
  );
}
