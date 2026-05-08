import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="p-4 bg-white border-t flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="flex-1 border rounded-xl px-3 py-2"
        placeholder="Type message..."
      />

      <button
        onClick={handleSend}
        className="bg-blue-500 text-white px-4 rounded-xl"
      >
        Send
      </button>
    </div>
  );
}