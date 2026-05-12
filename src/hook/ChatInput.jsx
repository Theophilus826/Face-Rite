import { useState } from "react";
import {
  Paperclip,
  Camera,
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
} from "lucide-react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const menuItems = [
    {
      label: "Document",
      icon: <FileText size={24} className="text-violet-400" />,
    },
    {
      label: "Camera",
      icon: <Camera size={24} className="text-pink-500" />,
    },
    {
      label: "Gallery",
      icon: <Image size={24} className="text-blue-500" />,
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
    <div className="relative bg-[#0b141a] p-4">
      {/* Popup Menu */}
      {showMenu && (
        <div className="absolute bottom-20 left-4 grid grid-cols-4 gap-5 bg-[#0b141a] p-4 rounded-3xl shadow-2xl z-20 w-[320px]">
          {menuItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl border border-gray-700 bg-[#111b21] flex items-center justify-center shadow-md">
                {item.icon}
              </div>
              <span className="text-gray-300 text-sm mt-2">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-3 bg-[#202c33] rounded-full px-4 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message"
          className="flex-1 bg-transparent text-white placeholder:text-gray-400 outline-none text-lg"
        />

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-400 hover:text-white transition"
        >
          <Paperclip size={24} />
        </button>

        <button className="text-gray-400 hover:text-white transition">
          <Camera size={24} />
        </button>

        <button
          onClick={handleSend}
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
        >
          <Mic size={24} className="text-black" />
        </button>
      </div>
    </div>
  );
}

