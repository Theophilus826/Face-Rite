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

import { RootState } from "../app/store";
import callService from "../features/CallService";

export default function CallScreen() {
  const {
    status,
    localStream,
    remoteStream,
    muted,
    videoEnabled,
    connectionState,
    call,
  } = useSelector((state: RootState) => state.call);

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

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
      LOCAL STREAM
  ========================== */

  useEffect(() => {
    if (localVideo.current && localStream) {
      localVideo.current.srcObject = localStream;
    }
  }, [localStream]);

  /* ==========================
      REMOTE STREAM
  ========================== */

  useEffect(() => {
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  /* ==========================
      CLEANUP
  ========================== */

  useEffect(() => {
    return () => {
      callService.cleanup();
    };
  }, []);

  if (!["calling", "accepted", "connected"].includes(status)) {
    return null;
  }

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

  const mute = () => {
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
    return (
      call?.receiver?.username ||
      call?.caller?.username ||
      "Unknown User"
    );
  }, [call]);

  const avatar = useMemo(() => {
    return (
      call?.receiver?.profilePicture ||
      call?.caller?.profilePicture ||
      "/default-avatar.png"
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

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Remote Video */}
      {remoteStream ? (
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-white">
          <img
            src={avatar}
            alt={displayName}
            className="w-40 h-40 rounded-full object-cover border-4 border-white"
          />

          <h2 className="mt-6 text-3xl font-semibold">
            {displayName}
          </h2>

          <p className="mt-3 text-lg opacity-70">
            {statusText}
          </p>
        </div>
      )}

      {/* Local Video */}
      {videoEnabled && localStream && (
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className="absolute top-5 right-5 w-44 h-64 rounded-xl border-2 border-white object-cover shadow-xl"
        />
      )}

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex flex-col items-center text-white">
        <h2 className="text-2xl font-bold">
          {displayName}
        </h2>

        <p className="mt-2 text-sm opacity-80">
          {statusText}
        </p>

        {connectionState && (
          <p className="text-xs opacity-60 mt-1">
            {connectionState}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="flex gap-5 bg-black/40 backdrop-blur-md px-6 py-4 rounded-full">

          <button
            onClick={mute}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center"
          >
            {muted ? <MicOff /> : <Mic />}
          </button>

          <button
            onClick={toggleVideo}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center"
          >
            {videoEnabled ? <Video /> : <VideoOff />}
          </button>

          <button
            onClick={switchCamera}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center"
          >
            <RefreshCcw />
          </button>

          <button
            onClick={end}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
          >
            <PhoneOff size={30} />
          </button>

        </div>
      </div>
    </div>
  );
}