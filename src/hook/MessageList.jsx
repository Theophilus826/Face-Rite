import { useEffect, useRef, useState } from "react";

export default function MessageList({ messages = [], userId, onDelete }) {
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const pressTimerRef = useRef(null);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const startPress = (messageId) => {
    if (!onDelete) return;

    clearPressTimer();

    pressTimerRef.current = setTimeout(() => {
      setSelectedMessageId(messageId);
      pressTimerRef.current = null;
    }, 600);
  };

  useEffect(() => {
    return () => clearPressTimer();
  }, []);

  const handleCancelPress = () => {
    clearPressTimer();
  };

  const handleDelete = async (messageId) => {
    if (!onDelete) return;
    await onDelete(messageId);
    setSelectedMessageId(null);
  };

  const handleImageError = (messageId) => {
    // console.error(`Image failed to load for message: ${messageId}`);
    setImageErrors((prev) => ({ ...prev, [messageId]: true }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, index) => {
        /* ================= SENDER ================= */

        const senderId =
          typeof msg.fromUser === "object" ? msg.fromUser?._id : msg.fromUser;

        const mine = senderId === userId;

        /* ================= GROUP ================= */

        const prev = messages[index - 1];

        const prevSender =
          typeof prev?.fromUser === "object"
            ? prev?.fromUser?._id
            : prev?.fromUser;

        const sameSender = prevSender === senderId;

        /* ================= MESSAGE TYPE ================= */

        const type = msg.type || msg.messageType || "text";

        

        return (
          <div
            key={msg._id || index}
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-xs md:max-w-sm"
              onPointerDown={() => startPress(msg._id)}
              onPointerUp={handleCancelPress}
              onPointerLeave={handleCancelPress}
              onTouchStart={() => startPress(msg._id)}
              onTouchEnd={handleCancelPress}
              onClick={() => {
                if (onDelete && mine) {
                  setSelectedMessageId(msg._id);
                }
              }}
              onContextMenu={(e) => {
                if (onDelete && mine) {
                  e.preventDefault();
                  setSelectedMessageId(msg._id);
                }
              }}
            >
              {/* NAME */}

              {!mine && !sameSender && (
                <p className="text-xs text-gray-400 mb-1 ml-1">
                  {msg.fromUser?.name || "User"}
                </p>
              )}

              {/* MESSAGE BUBBLE */}

              <div
                className={`relative rounded-2xl overflow-hidden backdrop-blur-xl border shadow-lg ${
                  mine
                    ? "bg-blue-500/80 border-blue-400/20 text-white"
                    : "bg-white/10 border-white/10 text-white"
                } ${
                  selectedMessageId === msg._id ? "ring-2 ring-red-400" : ""
                }`}
              >
                {/* delete control for own messages */}
                {selectedMessageId === msg._id && onDelete && mine && (
                  <button
                    onClick={() => handleDelete(msg._id)}
                    className="absolute -right-2 -top-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full shadow-lg z-10"
                  >
                    Delete
                  </button>
                )}

                {/* ================= TEXT ================= */}

                {type === "text" && (
                  <div className="px-4 py-3 break-words">
                    {msg.text || msg.content}
                  </div>
                )}

                {/* ================= IMAGE ================= */}

                {type === "image" && (
                  <div className="p-1">
                    {!imageErrors[msg._id] ? (
                      <div className="relative w-full">
                        <img
                          src={
                            msg.image || msg.imageUrl || msg.file || msg.media
                          }
                          alt="chat"
                          className="rounded-2xl max-w-full w-full object-cover cursor-pointer max-h-96"
                          loading="eager"
                          onError={() => handleImageError(msg._id)}
                          onClick={() =>
                            window.open(
                              msg.image ||
                                msg.imageUrl ||
                                msg.file ||
                                msg.media,
                              "_blank",
                            )
                          }
                        />

                        <a
                          href={
                            msg.image || msg.imageUrl || msg.file || msg.media
                          }
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur"
                        >
                          Download
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-2xl max-w-full w-full h-48 bg-gray-700/50 flex items-center justify-center">
                        <p className="text-xs text-gray-400">
                          Image failed to load
                        </p>
                      </div>
                    )}

                    {(msg.text || msg.caption) && (
                      <p className="px-3 pb-3 pt-2 text-sm">
                        {msg.text || msg.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* ================= AUDIO ================= */}

                {(type === "audio" || type === "voice") && (
                  <div className="p-3">
                    <audio controls className="max-w-[240px]">
                      <source
                        src={msg.audio || msg.audioUrl || msg.file || msg.media}
                        type="audio/webm"
                      />
                    </audio>
                  </div>
                )}

                {/* ================= VIDEO ================= */}

                {type === "video" && (
                  <div className="p-1">
                    <video controls className="rounded-2xl max-w-full">
                      <source src={msg.videoUrl || msg.file || msg.media} />
                    </video>
                  </div>
                )}

                {/* ================= FILE ================= */}

                {type === "file" && (
                  <a
                    href={msg.fileUrl || msg.file}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-3 underline text-sm"
                  >
                    Download File
                  </a>
                )}
              </div>

              {/* ================= TIME ================= */}

              <p
                className={`text-[10px] mt-1 px-1 text-gray-400 ${
                  mine ? "text-right" : "text-left"
                }`}
              >
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
