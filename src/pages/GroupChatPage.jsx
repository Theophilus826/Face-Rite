import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export default function GroupChatPage() {
  const { groupId } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);

  const esRef = useRef(null);
  const bottomRef = useRef(null);

  /* ================= FETCH GROUP ================= */
  useEffect(() => {
    if (!groupId) return;

    API.get(`/group/${groupId}`)
      .then((res) => setGroup(res.data.group))
      .catch(() => toast.error("Failed to load group"));
  }, [groupId]);

  /* ================= SSE STREAM ================= */
  useEffect(() => {
    if (!user || !groupId) return;

    esRef.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/group/stream/${groupId}/${user._id}`
    );

    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.type) {

        /* ================= INIT ================= */
        case "init":
          setMessages(data.messages || []);
          break;

        /* ================= NEW MESSAGE ================= */
        case "new_message":
          setMessages((prev) => [...prev, data.message]);
          break;

        /* ================= TYPING ================= */
        case "typing":
          setTypingUser(data.fromUser);
          break;

        case "stop_typing":
          setTypingUser(null);
          break;

        /* ================= ONLINE MEMBERS ================= */
        case "online_members":
          setOnlineMembers(data.members || []);
          break;

        /* ================= GROUP EVENTS ================= */
        case "group_event":
          if (data.event === "member_added") {
            setGroup((prev) => ({
              ...prev,
              members: [...prev.members, { user: data.memberId }],
            }));
          }

          if (data.event === "member_removed") {
            setGroup((prev) => ({
              ...prev,
              members: prev.members.filter(
                (m) => m.user._id !== data.memberId
              ),
            }));
          }

          break;

        default:
          break;
      }
    };

    es.onerror = () => {
      toast.error("Connection lost");
    };

    return () => es.close();
  }, [user, groupId]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND TEXT ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    const temp = {
      _id: Date.now(),
      fromUser: { _id: user._id, name: user.name },
      text,
      type: "text",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, temp]);
    setText("");

    try {
      await API.post("/group/send-message", {
        groupId,
        text,
      });
    } catch {
      toast.error("Failed to send");
    }
  };

  /* ================= SEND IMAGE ================= */
  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("image", file);
    form.append("groupId", groupId);

    try {
      await API.post("/group/send-image", form);
    } catch {
      toast.error("Image failed");
    }
  };

  /* ================= SEND VOICE ================= */
  const sendVoice = async (blob) => {
    const form = new FormData();
    form.append("audio", blob);
    form.append("groupId", groupId);

    try {
      await API.post("/group/send-voice", form);
    } catch {
      toast.error("Voice failed");
    }
  };

  /* ================= TYPING ================= */
  const handleTyping = async (value) => {
    setText(value);

    try {
      await API.post("/group/typing", { groupId });

      setTimeout(async () => {
        await API.post("/group/stop-typing", { groupId });
      }, 800);
    } catch {}
  };

  /* ================= UI ================= */
  if (!group) return <div className="p-4">Loading group...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* HEADER */}
      <div className="p-3 bg-white border-b flex justify-between">
        <div>
          <h2 className="font-semibold">{group.name}</h2>
          <p className="text-xs text-gray-500">
            {group.members?.length} members • {onlineMembers.length} online 🟢
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.fromUser?._id === user._id;

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-xs text-sm ${
                  isMe ? "bg-blue-500 text-white" : "bg-white border"
                }`}
              >

                {/* NAME */}
                {!isMe && (
                  <p className="text-xs font-semibold mb-1">
                    {msg.fromUser?.name}
                  </p>
                )}

                {/* TEXT */}
                {msg.type === "text" && msg.text}

                {/* IMAGE */}
                {msg.type === "image" && (
                  <img
                    src={msg.image}
                    className="rounded max-w-xs"
                    alt="img"
                  />
                )}

                {/* VOICE */}
                {msg.type === "voice" && (
                  <audio controls src={msg.audio} />
                )}

                {/* TICKS */}
                {isMe && (
                  <div className="text-[10px] mt-1 opacity-70">
                    {msg.seenBy?.length > 0 ? "✔✔" : "✔"}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* TYPING */}
        {typingUser && (
          <p className="text-xs text-gray-500">
            Someone is typing...
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 bg-white border-t flex gap-2 items-center">

        {/* IMAGE UPLOAD */}
        <input type="file" onChange={sendImage} />

        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type message..."
          className="flex-1 border rounded px-3 py-2"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}