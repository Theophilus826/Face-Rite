import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import callService from "../features/CallService";

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
  const navigate = useNavigate();

  useEffect(() => {
    const listener = (event) => {
      switch (event.type) {
        /* ===================================
            OUTGOING CALL
        =================================== */

        case "calling":
          dispatch(setOutgoingCall(event.call));
          break;

        /* ===================================
            INCOMING CALL
        =================================== */

        case "incoming_call":
          dispatch(setIncomingCall(event.call));
          break;

        /* ===================================
            ACCEPTED
        =================================== */

        case "call_accepted":
          dispatch(setAccepted());

          navigate("/call", {
            replace: true,
          });

          break;

        /* ===================================
            CONNECTED
        =================================== */

        case "call_connected":
          dispatch(setConnected());

          navigate("/call", {
            replace: true,
          });

          break;

        /* ===================================
            LOCAL STREAM
        =================================== */

        case "local_stream":
          dispatch(setLocalStream(event.stream));
          break;

        /* ===================================
            REMOTE STREAM
        =================================== */

        case "remote_stream":
          dispatch(setRemoteStream(event.stream));
          break;

        /* ===================================
            CONNECTION STATE
        =================================== */

        case "connection_state":
          dispatch(
            setConnectionState(event.state)
          );

          break;

        /* ===================================
            RECONNECTING
        =================================== */

        case "reconnecting":
          dispatch(
            setConnectionState("reconnecting")
          );

          break;

        /* ===================================
            FAILED
        =================================== */

        case "failed":
          dispatch(
            setConnectionState("failed")
          );

          dispatch(resetCall());

          navigate(-1);

          break;

        /* ===================================
            MUTE
        =================================== */

        case "mute_changed": {
          const muted =
            callService.localStream
              ?.getAudioTracks()
              .every(
                (track) => !track.enabled
              ) ?? false;

          dispatch(setMuted(muted));

          break;
        }

        /* ===================================
            VIDEO
        =================================== */

        case "video_changed": {
          const enabled =
            callService.localStream
              ?.getVideoTracks()
              .every(
                (track) => track.enabled
              ) ?? true;

          dispatch(
            setVideoEnabled(enabled)
          );

          break;
        }

        /* ===================================
            CALL ENDED
        =================================== */

        case "call_ended":
          dispatch(endCall());

          dispatch(resetCall());

          navigate(-1);

          break;

        /* ===================================
            CANCELLED
        =================================== */

        case "call_cancelled":
          dispatch(resetCall());

          navigate(-1);

          break;

        /* ===================================
            REJECTED
        =================================== */

        case "call_rejected":
          dispatch(resetCall());

          navigate(-1);

          break;

        /* ===================================
            TIMEOUT
        =================================== */

        case "call_timeout":
          dispatch(resetCall());

          navigate(-1);

          break;

        /* ===================================
            CLEANUP
        =================================== */

        case "cleanup":
          dispatch(resetCall());

          break;

        /* ===================================
            ERROR
        =================================== */

        case "error":
          dispatch(
            setError(event.error)
          );

          console.error(event.error);

          break;

        default:
          console.log(
            "Unknown Call Event:",
            event
          );
      }
    };

    callService.subscribe(listener);

    return () => {
      callService.unsubscribe(listener);
    };
  }, [dispatch, navigate]);

  return null;
}