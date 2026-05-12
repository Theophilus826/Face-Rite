import { useRef, useState } from "react";
import {
  Paperclip,
  Mic,
  FileText,
  Image,
  Headphones,
  Store,
  Zap,
  MapPin,
  User,
  BarChart3,
  Calendar,
  Camera,
  Send,
} from "lucide-react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  /* ================= SEND TEXT ================= */

  const handleSend = () => {
    if (!text.trim()) return;

    onSend({
      type: "text",
      content: text,
    });

    setText("");
  };

  /* ================= CAMERA ================= */

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    onSend({
      type: "image",
      file,
    });
  };

  /* ================= GALLERY ================= */

  const openGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleGallerySelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    onSend({
      type: "image",
      file,
    });
  };

  /* ================= MIC ================= */

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const audioFile = new File([audioBlob], "voice-message.webm", {
          type: "audio/webm",
        });

        onSend({
          type: "audio",
          file: audioFile,
        });
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  /* ================= MENU ================= */

  const menuItems = [
    {
      label: "Document",
      icon: <FileText size={24} className="text-violet-400" />,
    },
    {
      label: "Camera",
      icon: <Camera size={24} className="text-pink-500" />,
      action: openCamera,
    },
    {
      label: "Gallery",
      icon: <Image size={24} className="text-blue-500" />,
      action: openGallery,
    },
    {
      label: "Audio",
      icon: <Headphones size={24} className="text-orange-400" />,
    },
    {
      label: "Catalogue",
      icon: <Store size={24} className="text-slate-400" />,
    },
    {
      label: "Quick Reply",
      icon: <Zap size={24} className="text-yellow-400" />,
    },
    {
      label: "Location",
      icon: <MapPin size={24} className="text-emerald-400" />,
    },
    {
      label: "Contact",
      icon: <User size={24} className="text-sky-400" />,
    },
    {
      label: "Poll",
      icon: <BarChart3 size={24} className="text-yellow-300" />,
    },
    {
      label: "Event",
      icon: <Calendar size={24} className="text-pink-500" />,
    },
  ];

  return (
    <div className="relative px-3 py-2 bg-transparent">
      {/* HIDDEN INPUTS */}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGallerySelect}
      />

      {/* MENU */}

      <div
        className={`absolute left-3 right-3 top-full mt-3 z-50 origin-top transition-all duration-300 ease-in-out ${
          showMenu
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="grid grid-cols-4 gap-4 rounded-3xl p-5 backdrop-blur-2xl bg-black/30 border border-white/10 shadow-2xl">
          {menuItems.map((item) => (
            <div
              key={item.label}
              onClick={() => {
                item.action?.();
                setShowMenu(false);
              }}
              className="flex flex-col items-center text-center cursor-pointer active:scale-95 transition duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-lg">
                {item.icon}
              </div>

              <span className="text-gray-200 text-xs mt-2">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* INPUT */}

      <div className="flex items-center gap-3 rounded-full px-4 py-3 backdrop-blur-2xl bg-white/10 border border-white/10 shadow-xl">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message"
          className="flex-1 bg-transparent text-white placeholder:text-gray-300 outline-none text-base"
        />

        {/* ATTACH */}

        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`transition duration-300 ${
            showMenu ? "rotate-45 text-white" : "text-gray-300"
          }`}
        >
          <Paperclip size={24} />
        </button>

        {/* SEND / MIC */}

        {text.trim() ? (
          <button
            onClick={handleSend}
            className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xl border border-white/10 flex items-center justify-center"
          >
            <Send size={20} className="text-white" />
          </button>
        ) : (
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
              recording
                ? "bg-red-500"
                : "bg-white/20 backdrop-blur-xl border border-white/10"
            }`}
          >
            <Mic size={20} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
