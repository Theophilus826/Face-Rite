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

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
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

  /* ================= LOAD USERS + GROUPS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          API.get("/users"),
          API.get("/group"),
        ]);

        const formattedUsers = (usersRes.data.users || []).map((u) => ({
          ...u,
          avatar: u.avatar
            ? u.avatar.startsWith("http")
              ? u.avatar
              : `${BASE_URL}/${u.avatar}`
            : null,
        }));

        setUsers(formattedUsers);
        setGroups(groupsRes.data.groups || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    };

    fetchData();
  }, [user, BASE_URL]);

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

      if (data.type === "init") {
        setMessages(data.messages || []);
      }

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

  /* ================= RECORD VOICE ================= */
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

  if (!user) {
    return <div className="text-center mt-10">Login required</div>;
  }

  /* ================= UI ================= */
  return (
    <div className="h-screen w-full flex text-white bg-black/20 backdrop-blur-2xl">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-[340px] border-r border-white/10 bg-white/5 flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between">
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-xs text-gray-400">Chats & Groups</p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1 bg-white/10 rounded-xl"
          >
            + Group
          </button>
        </div>

        {/* USERS */}
        <div className="p-2 overflow-y-auto">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/chat/${u._id}`)}
              className="p-3 hover:bg-white/5 rounded-xl cursor-pointer"
            >
              {u.name}
            </div>
          ))}

          {/* GROUPS */}
          <div className="mt-4 border-t border-white/10 pt-2">
            <p className="text-xs text-gray-400 px-2 mb-2">Groups</p>

            {groups.map((g) => (
              <div
                key={g._id}
                onClick={() => navigate(`/group/${g._id}`)}
                className="p-3 hover:bg-white/5 rounded-xl cursor-pointer"
              >
                {g.name}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 flex flex-col">
        {groupId ? (
          <GroupChatPage />
        ) : !chatUserId ? (
          <div className="flex-1 flex items-center justify-center">
            Select a chat
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="p-4 border-b border-white/10">
              {selectedUser?.name}
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div key={msg._id} className="mb-2">
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                className="flex-1 bg-white/10 p-2 rounded"
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}
      </main>

      {/* ================= CREATE GROUP MODAL ================= */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white/10 p-5 rounded-xl w-[400px]">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full p-2 mb-3 bg-white/10"
            />

            <button onClick={createGroup}>Create</button>
          </div>
        </div>
      )}
    </div>
  );
}