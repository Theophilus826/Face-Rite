import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  /* ===========================
      CALL
  =========================== */

  status: "idle", // idle | ringing | calling | accepted | connected | ended

  call: null,

  callId: null,

  callType: "voice",

  isCaller: false,

  incoming: false,

  /* ===========================
      MEDIA
  =========================== */

  localStream: null,

  remoteStream: null,

  muted: false,

  videoEnabled: true,

  /* ===========================
      CONNECTION
  =========================== */

  connectionState: "new",

  iceConnectionState: "new",

  signalingState: "stable",

  /* ===========================
      ERROR
  =========================== */

  error: null,
};

const callSlice = createSlice({
  name: "call",

  initialState,

  reducers: {
    /* ===========================
        INCOMING
    =========================== */

    setIncomingCall(state, action) {
      state.status = "ringing";

      state.incoming = true;

      state.isCaller = false;

      state.call = action.payload;

      state.callId = action.payload.id;

      state.callType = action.payload.type;

      state.connectionState = "new";

      state.iceConnectionState = "new";

      state.signalingState = "stable";

      state.error = null;
    },

    /* ===========================
        OUTGOING
    =========================== */

    setOutgoingCall(state, action) {
      state.status = "calling";

      state.incoming = false;

      state.isCaller = true;

      state.call = action.payload;

      state.callId = action.payload.id;

      state.callType = action.payload.type;

      state.connectionState = "new";

      state.iceConnectionState = "new";

      state.signalingState = "stable";

      state.error = null;
    },

    /* ===========================
        UPDATE CALL
    =========================== */

    updateCall(state, action) {
      if (!state.call) return;

      state.call = {
        ...state.call,
        ...action.payload,
      };
    },

    /* ===========================
        STATUS
    =========================== */

    setCallStatus(state, action) {
      state.status = action.payload;
    },

    setAccepted(state) {
      state.status = "accepted";

      state.incoming = false;
    },

    setConnected(state) {
      state.status = "connected";
    },

    endCall(state) {
      state.status = "ended";

      state.connectionState = "closed";

      state.iceConnectionState = "closed";

      state.signalingState = "closed";

      state.localStream = null;

      state.remoteStream = null;
    },

    /* ===========================
        CONNECTION
    =========================== */

    setConnectionState(state, action) {
      state.connectionState = action.payload;
    },

    setIceConnectionState(state, action) {
      state.iceConnectionState = action.payload;
    },

    setSignalingState(state, action) {
      state.signalingState = action.payload;
    },

    /* ===========================
        STREAMS
    =========================== */

    setLocalStream(state, action) {
      state.localStream = action.payload;
    },

    setRemoteStream(state, action) {
      state.remoteStream = action.payload;
    },

    clearStreams(state) {
      state.localStream = null;

      state.remoteStream = null;
    },

    /* ===========================
        AUDIO
    =========================== */

    setMuted(state, action) {
      state.muted = action.payload;
    },

    /* ===========================
        VIDEO
    =========================== */

    setVideoEnabled(state, action) {
      state.videoEnabled = action.payload;
    },

    /* ===========================
        ERROR
    =========================== */

    setError(state, action) {
      state.error = action.payload;
    },

    clearError(state) {
      state.error = null;
    },

    /* ===========================
        RESET
    =========================== */

    resetCall() {
      return {
        ...initialState,
      };
    },
  },
});

export const {
  setIncomingCall,
  setOutgoingCall,
  updateCall,

  setCallStatus,
  setAccepted,
  setConnected,
  endCall,

  setConnectionState,
  setIceConnectionState,
  setSignalingState,

  setLocalStream,
  setRemoteStream,
  clearStreams,

  setMuted,
  setVideoEnabled,

  setError,
  clearError,

  resetCall,
} = callSlice.actions;

export default callSlice.reducer;