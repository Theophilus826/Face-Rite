export default function MessageList({
  messages = [],
  userId,
  onDelete,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, index) => {
        /* ================= SENDER ================= */

        const senderId =
          typeof msg.fromUser === "object"
            ? msg.fromUser?._id
            : msg.fromUser;

        const mine = senderId === userId;

        /* ================= GROUP ================= */

        const prev = messages[index - 1];

        const prevSender =
          typeof prev?.fromUser === "object"
            ? prev?.fromUser?._id
            : prev?.fromUser;

        const sameSender = prevSender === senderId;

        /* ================= MESSAGE TYPE ================= */

        const type =
          msg.type ||
          msg.messageType ||
          "text";

        return (
          <div
            key={msg._id || index}
            className={`flex ${
              mine
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div className="max-w-xs md:max-w-sm">

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
                }`}
              >

                {/* delete control for own text messages */}
                {mine && onDelete && type === "text" && (
                  <button
                    onClick={() => onDelete(msg._id)}
                    className="absolute -right-2 -top-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full shadow-lg"
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
                    <img
                      src={
                        msg.imageUrl ||
                        msg.file ||
                        msg.media
                      }
                      alt="chat"
                      className="rounded-2xl max-w-full object-cover"
                    />

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
                    <audio
                      controls
                      className="max-w-[240px]"
                    >
                      <source
                        src={
                          msg.audio ||
                          msg.audioUrl ||
                          msg.file ||
                          msg.media
                        }
                        type="audio/webm"
                      />
                    </audio>
                  </div>
                )}

                {/* ================= VIDEO ================= */}

                {type === "video" && (
                  <div className="p-1">
                    <video
                      controls
                      className="rounded-2xl max-w-full"
                    >
                      <source
                        src={
                          msg.videoUrl ||
                          msg.file ||
                          msg.media
                        }
                      />
                    </video>
                  </div>
                )}

                {/* ================= FILE ================= */}

                {type === "file" && (
                  <a
                    href={
                      msg.fileUrl ||
                      msg.file
                    }
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
                  mine
                    ? "text-right"
                    : "text-left"
                }`}
              >
                {msg.createdAt
                  ? new Date(
                      msg.createdAt
                    ).toLocaleTimeString([], {
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