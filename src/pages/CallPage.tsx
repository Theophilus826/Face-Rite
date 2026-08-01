import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  RefreshCcw,
} from "lucide-react";

import type { RootState } from "../app/store";
import callService from "../features/callService";

export default function CallPage() {
  const {
    status,
    call,
    localStream,
    remoteStream,
    muted,
    videoEnabled,
    connectionState,
  } = useSelector((state: RootState) => state.call);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [duration, setDuration] = useState(0);

  /* ==========================
      TIMER
  ========================== */

  useEffect(() => {
    if (status !== "connected") return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  /* ==========================
      LOCAL VIDEO
  ========================== */

  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;

    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  /* ==========================
      REMOTE VIDEO
  ========================== */

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;

    remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  /* ==========================
      CLEANUP
  ========================== */

  useEffect(() => {
    return () => {
      callService.cleanup();
    };
  }, []);

  /* ==========================
      ACTIONS
  ========================== */

  const end = async () => {
    try {
      await callService.end();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMute = () => {
    callService.toggleMute();
  };

  const toggleVideo = () => {
    callService.toggleVideo();
  };

  const switchCamera = () => {
    callService.switchCamera();
  };

  /* ==========================
      HELPERS
  ========================== */

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const displayName = useMemo(() => {
    return call?.receiver?.username || call?.caller?.username || "Unknown User";
  }, [call]);

  const avatar = useMemo(() => {
    const otherUser = callService.isCaller ? call?.receiver : call?.caller;

    return (
      otherUser?.avatar || "https://swordgame-5.onrender.com/default-avatar.jpg"
    );
  }, [call]);

  const statusText = useMemo(() => {
    switch (status) {
      case "calling":
        return "Calling...";

      case "accepted":
        return "Connecting...";

      case "connected":
        return formatTime(duration);

      default:
        return status;
    }
  }, [status, duration]);

  if (!["calling", "accepted", "connected"].includes(status)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden">
      {/* ================= REMOTE ================= */}

      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-white">
          <img
            src={avatar}
            alt={displayName}
            className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-2xl"
          />

          <h2 className="mt-6 text-3xl font-bold">{displayName}</h2>

          <p className="mt-3 text-lg opacity-70">{statusText}</p>

          <p className="mt-2 text-sm opacity-50">{connectionState}</p>
        </div>
      )}

      {/* ================= LOCAL ================= */}

      {videoEnabled && localStream && (
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute top-5 right-5 w-40 h-60 rounded-2xl object-cover border-2 border-white shadow-xl bg-black"
        />
      )}

      {/* ================= HEADER ================= */}

      <div className="absolute top-6 left-0 right-0 flex flex-col items-center text-white">
        <h1 className="text-3xl font-bold">{displayName}</h1>

        <p className="mt-2 text-sm opacity-70">{statusText}</p>
      </div>

      {/* ================= CONTROLS ================= */}

      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-5 rounded-full bg-black/40 backdrop-blur-md px-6 py-4">
          <button
            onClick={toggleMute}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
          >
            {muted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={toggleVideo}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
          >
            {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>

          <button
            onClick={switchCamera}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
          >
            <RefreshCcw size={22} />
          </button>

          <button
            onClick={end}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700 hover:scale-105"
          >
            <PhoneOff size={30} />
          </button>
        </div>
      </div>
    </div>
  );
}
