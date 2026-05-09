export default function MessageList({ messages = [], userId }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, index) => {

        /* ================= FIX SENDER ================= */
        const senderId =
          typeof msg.fromUser === "object"
            ? msg.fromUser?._id
            : msg.fromUser;

        const mine = senderId === userId;

        /* ================= GROUP SAME USER ================= */
        const prev = messages[index - 1];

        const prevSender =
          typeof prev?.fromUser === "object"
            ? prev?.fromUser?._id
            : prev?.fromUser;

        const sameSender = prevSender === senderId;

        return (
          <div
            key={msg._id || index}
            className={`flex ${
              mine ? "justify-end" : "justify-start"
            }`}
          >
            <div className="max-w-xs">

              {/* SHOW NAME ONLY ON FIRST MESSAGE */}
              {!mine && !sameSender && (
                <p className="text-xs text-gray-500 mb-1 ml-1">
                  {msg.fromUser?.name || "User"}
                </p>
              )}

              {/* MESSAGE */}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  mine
                    ? "bg-blue-500 text-white"
                    : "bg-white border"
                }`}
              >
                {msg.text}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}