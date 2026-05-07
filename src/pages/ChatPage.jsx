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
  const [groups, setGroups] = useState([]); // ✅ GROUP LIST
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
          })),
        );
      })
      .catch(() => toast.error("Failed to load users"));
  }, [user]);

  /* ================= LOAD GROUPS (NEW) ================= */
  useEffect(() => {
    if (!user) return;

    API.get("/group") // 🔁 change to "/groups" if needed
      .then(({ data }) => {
        setGroups(data.groups || []);
      })
      .catch(() => toast.error("Failed to load groups"));
  }, [user]);

  /* ================= FILTER USERS ================= */
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;

    return users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, users]);

  const selectedUser = users.find((u) => u._id === chatUserId);

  /* ================= LOAD CHAT ================= */
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

  /* ================= CREATE GROUP ================= */
  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x._id === u._id)
        ? prev.filter((x) => x._id !== u._id)
        : [...prev, u],
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
      setSearch("");

      navigate(`/group/${res.data.group._id}`);
    } catch {
      toast.error("Failed to create group");
    }
  };

  if (!user) {
    return <div className="text-center mt-10">Login required</div>;
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-transparent text-white flex backdrop-blur-2xl">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-full md:w-[340px] border-r border-white/10 bg-white/5 backdrop-blur-3xl flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-xs text-gray-400">Connect with friends</p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-2xl text-sm"
          >
            + Group
          </button>
        </div>

        {/* USERS */}
        <div className="p-2 text-xs text-gray-400">Users</div>
        <div className="flex-1 overflow-y-auto px-2">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className="p-3 rounded-xl hover:bg-white/10 cursor-pointer"
            >
              {u.name}
            </div>
          ))}
        </div>

        {/* GROUPS (NEW SECTION) */}
        <div className="p-2 text-xs text-gray-400 border-t border-white/10">
          Groups
        </div>
        <div className="overflow-y-auto px-2 pb-4">
          {groups.length === 0 ? (
            <p className="text-xs text-gray-500 p-2">No groups</p>
          ) : (
            groups.map((g) => (
              <div
                key={g._id}
                onClick={() => navigate(`/group/${g._id}`)}
                className="p-3 rounded-xl hover:bg-white/10 cursor-pointer"
              >
                {g.name}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ================= CHAT AREA (UNCHANGED) ================= */}
      <main className="flex-1 flex flex-col">
        {/* keep your existing chat UI exactly as-is */}
        {/* (unchanged to avoid breaking logic) */}
      </main>

      {/* ================= CREATE GROUP MODAL (UNCHANGED) ================= */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white/10 p-6 rounded-xl w-[400px]">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full p-2 mb-3 bg-black/30"
            />

            <div className="max-h-60 overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="p-2 cursor-pointer"
                >
                  {u.name}
                </div>
              ))}
            </div>

            <button onClick={createGroup} className="mt-3 bg-blue-500 px-4 py-2">
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}