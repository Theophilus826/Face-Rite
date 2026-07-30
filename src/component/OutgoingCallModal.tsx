import { useSelector } from "react-redux";
import { RootState } from "../app/store";

import callService from "../features/callService";

export default function OutgoingCallModal() {
  const { status, call } = useSelector(
    (state: RootState) => state.call
  );

  if (status !== "calling" || !call) {
    return null;
  }

  const cancel = async () => {
    try {
      await callService.cancel();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex items-center justify-center">

      <div className="flex flex-col items-center">

        <img
          src={
            call.receiver?.profilePicture ||
            "/default-avatar.png"
          }
          alt=""
          className="w-28 h-28 rounded-full object-cover border-4 border-white animate-pulse"
        />

        <h2 className="mt-6 text-3xl font-semibold">
          {call.receiver?.username ||
            "Unknown User"}
        </h2>

        <p className="mt-2 opacity-70">
          Calling...
        </p>

        <p className="text-sm opacity-50 mt-1">
          {call.type === "video"
            ? "Video Call"
            : "Voice Call"}
        </p>

        <button
          onClick={cancel}
          className="mt-12 w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center justify-center text-3xl"
        >
          📞
        </button>

      </div>

    </div>
  );
}