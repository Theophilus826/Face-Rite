import {
  Phone,
  Video,
} from "lucide-react";
import { useSelector } from "react-redux";

import type { RootState } from "../app/store";
import callService from "../features/CallService";

interface Props {
  userId: string;
}

export default function CallButton({
  userId,
}: Props) {
  const { status } = useSelector(
    (state: RootState) => state.call
  );

  const disabled =
    status !== "idle" &&
    status !== "ended";

  const startVoiceCall = async () => {
    if (disabled) return;

    try {
      await callService.start(
        userId,
        "voice"
      );
    } catch (err) {
      console.error(err);
    }
  };

  const startVideoCall = async () => {
    if (disabled) return;

    try {
      await callService.start(
        userId,
        "video"
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-2">

      <button
        disabled={disabled}
        onClick={startVoiceCall}
        className="w-10 h-10 rounded-full border hover:bg-neutral-100 disabled:opacity-40 flex items-center justify-center transition"
      >
        <Phone size={18} />
      </button>

      <button
        disabled={disabled}
        onClick={startVideoCall}
        className="w-10 h-10 rounded-full border hover:bg-neutral-100 disabled:opacity-40 flex items-center justify-center transition"
      >
        <Video size={18} />
      </button>

    </div>
  );
}