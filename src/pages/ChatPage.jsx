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

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const eventSourceRef = useRef(null);
  const messagesEndRef = useRef(null);

  const selectedUser = users.find((u) => u._id === chatUserId);

  const BASE_URL = API.defaults.baseURL.replace("/api", "");

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
        console.error("Fetch users error:", err);
      }
    };

    fetchUsers();
  }, [user]);

  /* ================= SSE ================= */
  useEffect(() => {
    if (!user || !chatUserId) return;

    if (eventSourceRef.current) eventSourceRef.current.close();

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
          // prevent duplicate for own messages
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

  /* ================= SEND TEXT ================= */
  const sendMessage = async () => {
    if (!chatText.trim()) return;

    const text = chatText.trim();
    setChatText("");

    const tempMessage = {
      fromUser: user._id,
      toUser: chatUserId,
      text,
      type: "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      await API.post("/chat/send", {
        toUserId: chatUserId,
        text,
      });

      await API.post("/chat/stop-typing", {
        toUserId: chatUserId,
      });
    } catch (err) {
      toast.error("Send failed");
      setMessages((prev) => prev.filter((m) => m !== tempMessage));
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
    } catch (err) {
      toast.error("Image send failed");
    }
  };

  /* ================= TYPING ================= */
  useEffect(() => {
    if (!chatText.trim()) return;

    const timeout = setTimeout(() => {
      API.post("/chat/typing", { toUserId: chatUserId }).catch(() => {});
    }, 300);

    return () => clearTimeout(timeout);
  }, [chatText]);

  /* ================= VOICE ================= */
  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      return toast.error("Audio not supported");
    }

    setRecording(true);
    audioChunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) =>
      audioChunksRef.current.push(e.data);

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
        await API.post("/chat/voice", formData);
      } catch {
        toast.error("Voice failed");
      }
    };
  };

  if (!user) return <div className="text-center mt-10">Login required</div>;

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white">

      {/* ================= USERS ================= */}
      <div className="flex gap-4 overflow-x-auto border-b p-2 bg-gray-50">
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => navigate(`/chat/${u._id}`)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer ${
              u._id === chatUserId ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
          >
            <div className="relative">
              {u.avatar ? (
                <img
                  src={u.avatar}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full">
                  {u.name?.charAt(0)}
                </div>
              )}

              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${
                  u.status === "online" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>

            <span className="text-sm font-medium">{u.name}</span>
          </div>
        ))}
      </div>

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 px-4 py-2 border-b">
        {selectedUser?.avatar ? (
          <img
            src={selectedUser.avatar}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full">
            {selectedUser?.name?.charAt(0)}
          </div>
        )}

        <div>
          <p className="font-semibold">{selectedUser?.name}</p>
          <p className="text-xs text-gray-500">
            {isTyping
              ? "typing..."
              : onlineStatus === "online"
              ? "online"
              : "offline"}
          </p>
        </div>
      </div>

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-2xl max-w-[70%] ${
              msg.fromUser === user._id
                ? "bg-blue-500 text-white self-end"
                : "bg-white border self-start"
            }`}
          >
            {msg.type === "image" ? (
              <img
                src={
                  msg.image?.startsWith("http")
                    ? msg.image
                    : `${BASE_URL}/${msg.image}`
                }
                className="rounded-lg"
              />
            ) : msg.type === "voice" ? (
              <audio controls src={msg.audio} />
            ) : (
              msg.text || msg.message
            )}
          </div>
        ))}

        <div ref={messagesEndRef}></div>
      </div>

      {/* ================= PREVIEW ================= */}
      {selectedImage && (
        <div className="p-2 border-t">
          <img
            src={URL.createObjectURL(selectedImage)}
            className="w-20 h-20 rounded object-cover"
          />
        </div>
      )}

      {/* ================= INPUT ================= */}
      <div className="p-2 border-t flex gap-2 bg-white pb-20 md:pb-2 items-center">

        <label className="cursor-pointer bg-gray-200 px-3 py-2 rounded">
          📷
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => setSelectedImage(e.target.files[0])}
          />
        </label>

        <input
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
          className="flex-1 border rounded p-2"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Send
        </button>

        {selectedImage && (
          <button
            onClick={sendImage}
            className="bg-green-600 text-white px-3 rounded"
          >
            Img
          </button>
        )}

        {!recording ? (
          <button onClick={startRecording}>🎤</button>
        ) : (
          <button onClick={stopRecording}>🛑</button>
        )}
      </div>
    </div>
  );
}