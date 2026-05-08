export default function MessageList({ messages, userId }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => {
        const mine = msg.fromUser === userId;

        return (
          <div
            key={msg._id}
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-xs ${
                mine ? "bg-blue-500 text-white" : "bg-white border"
              }`}
            >
              {msg.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}