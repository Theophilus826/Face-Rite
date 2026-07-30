import { useEffect } from "react";
import { useDispatch } from "react-redux";

import callService from "../features/callService";

import {
  setIncomingCall,
  setOutgoingCall,
  setAccepted,
  setConnected,
  setConnectionState,
  setLocalStream,
  setRemoteStream,
  setMuted,
  setVideoEnabled,
  setError,
  endCall,
  resetCall,
} from "../features/callSlice";

export default function CallListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    const listener = (event) => {
      switch (event.type) {
        /* ===========================
            OUTGOING
        =========================== */

        case "calling":
          dispatch(
            setOutgoingCall(event.call)
          );
          break;

        /* ===========================
            INCOMING
        =========================== */

        case "incoming_call":
          dispatch(
            setIncomingCall(event.call)
          );
          break;

        /* ===========================
            ACCEPTED
        =========================== */

        case "call_accepted":
          dispatch(setAccepted());
          break;

        /* ===========================
            CONNECTED
        =========================== */

        case "call_connected":
          dispatch(setConnected());
          break;

        /* ===========================
            LOCAL STREAM
        =========================== */

        case "local_stream":
          dispatch(
            setLocalStream(event.stream)
          );
          break;

        /* ===========================
            REMOTE STREAM
        =========================== */

        case "remote_stream":
          dispatch(
            setRemoteStream(event.stream)
          );
          break;

        /* ===========================
            CONNECTION
        =========================== */

        case "connection_state":
          dispatch(
            setConnectionState(event.state)
          );
          break;

        /* ===========================
            MUTE
        =========================== */

        case "mute_changed": {
          const muted =
            callService.localStream
              ?.getAudioTracks()
              ?.every(
                (track) => !track.enabled
              ) ?? false;

          dispatch(
            setMuted(muted)
          );

          break;
        }

        /* ===========================
            VIDEO
        =========================== */

        case "video_changed": {
          const enabled =
            callService.localStream
              ?.getVideoTracks()
              ?.every(
                (track) => track.enabled
              ) ?? true;

          dispatch(
            setVideoEnabled(enabled)
          );

          break;
        }

        /* ===========================
            ENDED
        =========================== */

        case "call_ended":
          dispatch(endCall());

          dispatch(resetCall());

          break;

        /* ===========================
            CANCELLED
        =========================== */

        case "call_cancelled":
          dispatch(resetCall());
          break;

        /* ===========================
            REJECTED
        =========================== */

        case "call_rejected":
          dispatch(resetCall());
          break;

        /* ===========================
            TIMEOUT
        =========================== */

        case "call_timeout":
          dispatch(resetCall());
          break;

        /* ===========================
            CLEANUP
        =========================== */

        case "cleanup":
          dispatch(resetCall());
          break;

        /* ===========================
            ERROR
        =========================== */

        case "error":
          dispatch(
            setError(event.error)
          );
          break;

        default:
          break;
      }
    };

    callService.subscribe(listener);

    return () => {
      callService.unsubscribe(listener);
    };
  }, [dispatch]);

  return null;
}