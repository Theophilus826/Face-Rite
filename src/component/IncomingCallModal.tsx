import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Phone,
  PhoneOff,
  Video,
} from "lucide-react";

import type { RootState } from "../app/store";
import callService from "../features/callService";

export default function IncomingCallModal() {
  const { status, call } = useSelector(
    (state: RootState) => state.call
  );

  const [loading, setLoading] = useState(false);

  if (status !== "ringing" || !call) {
    return null;
  }

  const caller = call.caller;

  const accept = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await callService.accept(
        call.type === "video"
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await callService.reject();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center">

      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 p-8 shadow-2xl text-white">

        <div className="flex flex-col items-center">

          <img
            src={
              caller?.profilePicture ??
              "/default-avatar.png"
            }
            alt={caller?.username ?? "Caller"}
            className="w-32 h-32 rounded-full object-cover border-4 border-white animate-pulse"
          />

          <h2 className="mt-6 text-3xl font-bold text-center">
            {caller?.username ?? "Unknown User"}
          </h2>

          <p className="mt-3 flex items-center gap-2 text-neutral-300">

            {call.type === "video" ? (
              <>
                <Video size={18} />
                Incoming Video Call
              </>
            ) : (
              <>
                <Phone size={18} />
                Incoming Voice Call
              </>
            )}

          </p>

          <div className="mt-10 flex items-center justify-center gap-10">

            <button
              disabled={loading}
              onClick={reject}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center transition"
            >
              <PhoneOff size={28} />
            </button>

            <button
              disabled={loading}
              onClick={accept}
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center transition"
            >
              <Phone size={28} />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}