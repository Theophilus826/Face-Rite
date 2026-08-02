import {
  startCall,
  acceptCall,
  rejectCall,
  endCall,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
} from "./Api";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

class CallService {
  constructor() {
    /* ===========================================
        CALL
    =========================================== */

    this.callId = null;

    this.call = null;

    this.isCaller = false;

    this.callType = "voice";

    /* ===========================================
        WEBRTC
    =========================================== */

    this.peer = null;

    this.localStream = null;

    this.remoteStream = null;

    /* ===========================================
        STATE
    =========================================== */

    this.connectionState = "new";

    this.signalingState = "stable";

    this.iceConnectionState = "new";

    /* ===========================================
        EVENTS
    =========================================== */

    this.listeners = new Set();
  }

  /* ===========================================
      EVENTS
  =========================================== */

  subscribe(listener) {
    this.listeners.add(listener);
  }

  unsubscribe(listener) {
    this.listeners.delete(listener);
  }

  emit(type, payload = {}) {
    this.listeners.forEach((listener) => {
      try {
        listener({
          type,
          ...payload,
        });
      } catch (err) {
        console.error("CALL LISTENER:", err);
      }
    });
  }

  /* ===========================================
      CREATE PEER
  =========================================== */

  async createPeer() {
    if (this.peer) {
      return this.peer;
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    this.peer = peer;

    /* ==========================
      LOCAL TRACKS
  ========================== */

    const addLocalTracks = () => {
      if (!this.localStream) {
        console.warn("No local stream available when creating peer");
        return;
      }

      const senders = peer.getSenders();

      this.localStream.getTracks().forEach((track) => {
        const exists = senders.some((sender) => sender.track?.id === track.id);

        if (!exists) {
          peer.addTrack(track, this.localStream);

          console.log("Added local track:", {
            id: track.id,
            kind: track.kind,
          });
        }
      });

      console.log("Total senders:", peer.getSenders().length);
    };

    addLocalTracks();

    /* ==========================
   REMOTE TRACK
========================== */

    peer.ontrack = (event) => {
      console.log("========== REMOTE TRACK ==========");
      console.log("Call ID:", this.callId);
      console.log("Streams:", event.streams.length);
      console.log("Track:", event.track.kind);
      console.log("Track ID:", event.track.id);
      console.log("Track State:", event.track.readyState);

      if (event.streams.length) {
        this.remoteStream = event.streams[0];

        console.log(
          "Remote tracks:",
          this.remoteStream.getTracks().map((t) => ({
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState,
          })),
        );

        this.emit("remote_stream", {
          stream: this.remoteStream,
        });
      } else {
        console.warn("No remote stream received");
      }

      event.track.onunmute = () => {
        console.log("Remote track unmuted:", event.track.kind);
      };

      event.track.onmute = () => {
        console.log("Remote track muted:", event.track.kind);
      };

      event.track.onended = () => {
        console.log("Remote track ended:", event.track.kind);
      };
    };

    /* ==========================
      ICE
  ========================== */

    peer.onicecandidate = async ({ candidate }) => {
      console.log("========== ICE EVENT ==========");
      console.log("Call ID:", this.callId);
      console.log("Candidate:", candidate);

      if (!candidate || !this.callId) {
        console.warn("Skipping ICE:", {
          hasCallId: !!this.callId,
          hasCandidate: !!candidate,
        });
        return;
      }

      try {
        const payload = {
          callId: this.callId,
          candidate,
        };

        console.log("Sending ICE:", payload);

        const res = await sendIceCandidate(payload);

        console.log("ICE sent:", res);
      } catch (err) {
        console.error("SEND ICE ERROR:");
        console.error("Payload:", {
          callId: this.callId,
          candidate,
        });
        console.error("Response:", err.response?.data);
        console.error(err);
      }
    };

    /* ==========================
      CONNECTION STATE
  ========================== */

    peer.onconnectionstatechange = () => {
      console.log("========== CONNECTION ==========");
      console.log("Connection:", peer.connectionState);
      console.log("ICE:", peer.iceConnectionState);
      console.log("Signaling:", peer.signalingState);

      this.connectionState = peer.connectionState;

      this.emit("connection_state", {
        state: peer.connectionState,
      });

      switch (peer.connectionState) {
        case "connected":
          console.log("✅ Peer connected");
          this.emit("call_connected");
          break;

        case "failed":
        case "closed":
        case "disconnected":
          console.log("❌ Peer closed");
          this.cleanup();
          break;

        default:
          break;
      }
    };

    /* ==========================
   ICE CONNECTION
========================== */

    peer.oniceconnectionstatechange = () => {
      this.iceConnectionState = peer.iceConnectionState;

      console.log("========== ICE CONNECTION ==========");
      console.log("Call ID:", this.callId);
      console.log("ICE State:", peer.iceConnectionState);
      console.log("Connection State:", peer.connectionState);
      console.log("Signaling State:", peer.signalingState);
      console.log("ICE Gathering:", peer.iceGatheringState);

      console.log("Local Description:", peer.localDescription?.type || null);

      console.log("Remote Description:", peer.remoteDescription?.type || null);

      console.log("Pending ICE:", this.pendingCandidates?.length || 0);

      this.emit("ice_state", {
        state: peer.iceConnectionState,
      });

      switch (peer.iceConnectionState) {
        case "new":
          console.log("ICE has not started.");
          break;

        case "checking":
          console.log("ICE is checking connectivity...");
          break;

        case "connected":
          console.log("✅ ICE connected");
          break;

        case "completed":
          console.log("✅ ICE completed");
          break;

        case "failed":
          console.error("❌ ICE failed");
          break;

        case "disconnected":
          console.warn("⚠️ ICE disconnected");
          break;

        case "closed":
          console.warn("⚠️ ICE closed");
          break;
      }
    };

    /* ==========================
   CONNECTION STATE
========================== */

    peer.onconnectionstatechange = () => {
      this.connectionState = peer.connectionState;

      console.log("========== CONNECTION ==========");
      console.log("Call ID:", this.callId);
      console.log("Connection:", peer.connectionState);
      console.log("ICE:", peer.iceConnectionState);
      console.log("Signaling:", peer.signalingState);

      console.log("Senders:", peer.getSenders().length);

      console.log("Receivers:", peer.getReceivers().length);

      console.log("Transceivers:", peer.getTransceivers().length);

      this.emit("connection_state", {
        state: peer.connectionState,
      });

      switch (peer.connectionState) {
        case "new":
          console.log("Peer created.");
          break;

        case "connecting":
          console.log("Connecting...");
          break;

        case "connected":
          console.log("✅ Peer connected");
          this.emit("call_connected");
          break;

        case "disconnected":
          console.warn("Peer disconnected");
          break;

        case "failed":
          console.error("Peer failed");
          break;

        case "closed":
          console.warn("Peer closed");
          break;
      }
    };

    /* ==========================
   SIGNALING STATE
========================== */

    peer.onsignalingstatechange = () => {
      this.signalingState = peer.signalingState;

      console.log("========== SIGNALING ==========");
      console.log("Call ID:", this.callId);
      console.log("State:", peer.signalingState);
      console.log("Local SDP:", peer.localDescription?.type);
      console.log("Remote SDP:", peer.remoteDescription?.type);

      this.emit("signaling_state", {
        state: peer.signalingState,
      });
    };

    /* ==========================
   ICE GATHERING
========================== */

    peer.onicegatheringstatechange = () => {
      console.log("========== ICE GATHERING ==========");
      console.log("Call ID:", this.callId);
      console.log("State:", peer.iceGatheringState);

      this.emit("ice_gathering_state", {
        state: peer.iceGatheringState,
      });
    };

    /* ==========================
   REMOTE TRACK
========================== */

    peer.ontrack = (event) => {
      console.log("========== REMOTE TRACK ==========");
      console.log("Call ID:", this.callId);
      console.log("Streams:", event.streams.length);
      console.log("Track:", event.track.kind);
      console.log("Track State:", event.track.readyState);

      this.remoteStream = event.streams[0];

      this.emit("remote_stream", {
        stream: this.remoteStream,
      });
    };
    return peer;
  }

  /* ===========================================
      PEER EVENTS
  =========================================== */

  registerPeerEvents() {
    if (!this.peer) return;

    /* ---------- Remote Stream ---------- */

    this.peer.ontrack = (event) => {
      const [stream] = event.streams;

      if (!stream) return;

      this.remoteStream = stream;

      this.emit("remote_stream", {
        stream,
      });
    };

    /* ---------- ICE Candidate ---------- */

    this.peer.onicecandidate = async (event) => {
      console.log("ICE EVENT", {
        callId: this.callId,
        candidate: event.candidate,
      });

      if (!event.candidate || !this.callId) {
        return;
      }

      try {
        await sendIceCandidate({
          callId: this.callId,
          candidate: event.candidate,
        });
      } catch (err) {
        console.error("ICE:", err.response?.data || err);
      }
    };

    /* ---------- Connection ---------- */
    /* ---------- Connection ---------- */

    this.peer.onconnectionstatechange = async () => {
      this.connectionState = this.peer.connectionState;

      console.log("========== CONNECTION STATE ==========");
      console.log("State:", this.connectionState);
      console.log("ICE:", this.peer.iceConnectionState);
      console.log("Signaling:", this.peer.signalingState);
      console.log("Call ID:", this.callId);

      this.emit("connection_state", {
        state: this.connectionState,
      });

      switch (this.connectionState) {
        case "connected":
          console.log("✅ Peer connected");

          this.emit("call_connected");
          break;

        case "connecting":
          console.log("⏳ Peer connecting...");
          break;

        case "failed":
          console.log("❌ Peer failed");

          if (this.callId) {
            try {
              await endCall({
                callId: this.callId,
              });

              console.log("Backend call ended");
            } catch (err) {
              console.error("END CALL:", err.response?.data || err);
            }
          }

          this.cleanup();
          break;

        case "disconnected":
          console.log("⚠️ Peer disconnected");

          if (this.callId) {
            try {
              await endCall({
                callId: this.callId,
              });
            } catch (err) {
              console.error("END CALL:", err.response?.data || err);
            }
          }

          this.cleanup();
          break;

        case "closed":
          console.log("🔒 Peer closed");

          this.cleanup();
          break;

        default:
          console.log("Connection state:", this.connectionState);
          break;
      }
    };

    /* ---------- ICE Connection ---------- */

    this.peer.oniceconnectionstatechange = () => {
      this.iceConnectionState = this.peer.iceConnectionState;

      console.log("========== ICE CONNECTION ==========");
      console.log("ICE State:", this.iceConnectionState);

      this.emit("ice_state", {
        state: this.iceConnectionState,
      });
    };

    /* ---------- ICE Gathering ---------- */

    this.peer.onicegatheringstatechange = () => {
      console.log("========== ICE GATHERING ==========");
      console.log("Gathering:", this.peer.iceGatheringState);

      this.emit("ice_gathering_state", {
        state: this.peer.iceGatheringState,
      });
    };

    /* ---------- Signaling ---------- */

    this.peer.onsignalingstatechange = () => {
      this.signalingState = this.peer.signalingState;

      console.log("========== SIGNALING ==========");
      console.log("State:", this.signalingState);

      this.emit("signaling_state", {
        state: this.signalingState,
      });
    };

    /* ---------- Negotiation ---------- */

    this.peer.onnegotiationneeded = () => {
      console.log("========== NEGOTIATION NEEDED ==========");

      this.emit("negotiation_needed");
    };

    /* ---------- Data Channel ---------- */

    this.peer.ondatachannel = (event) => {
      console.log("========== DATA CHANNEL ==========");
      console.log(event.channel.label);

      this.emit("data_channel", {
        channel: event.channel,
      });
    };
  }

  // Part 1B continues here...
  /* ===========================================
    LOCAL MEDIA
=========================================== */

  async createLocalStream(video = false) {
    if (this.localStream) {
      return this.localStream;
    }

    console.log("========== CREATE LOCAL STREAM ==========");

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video,
    });

    console.log(
      "Local tracks:",
      this.localStream.getTracks().map((track) => ({
        id: track.id,
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
      })),
    );

    this.emit("local_stream", {
      stream: this.localStream,
    });

    /* ==========================
      ADD TRACKS TO EXISTING PEER
  ========================== */

    if (this.peer) {
      console.log("Peer already exists. Adding local tracks...");

      this.localStream.getTracks().forEach((track) => {
        const exists = this.peer
          .getSenders()
          .some((sender) => sender.track?.id === track.id);

        if (exists) {
          console.log("Track already added:", track.kind);
          return;
        }

        this.peer.addTrack(track, this.localStream);

        console.log("Added track:", {
          id: track.id,
          kind: track.kind,
        });
      });

      console.log("Total senders:", this.peer.getSenders().length);
    }

    return this.localStream;
  }

  /* ===========================================
    REPLACE TRACK
=========================================== */

  async replaceTrack(kind, newTrack) {
    if (!this.peer) return;

    const sender = this.peer
      .getSenders()
      .find((sender) => sender.track?.kind === kind);

    if (!sender) return;

    await sender.replaceTrack(newTrack);

    if (!this.localStream) return;

    const oldTrack = this.localStream
      .getTracks()
      .find((track) => track.kind === kind);

    if (oldTrack) {
      oldTrack.stop();
      this.localStream.removeTrack(oldTrack);
    }

    this.localStream.addTrack(newTrack);

    this.emit("local_stream", {
      stream: this.localStream,
    });
  }

  /* ===========================================
    DEVICES
=========================================== */

  async getDevices() {
    return navigator.mediaDevices.enumerateDevices();
  }

  async getCameras() {
    const devices = await this.getDevices();

    return devices.filter((device) => device.kind === "videoinput");
  }

  async getMicrophones() {
    const devices = await this.getDevices();

    return devices.filter((device) => device.kind === "audioinput");
  }

  /* ===========================================
    SWITCH CAMERA
=========================================== */

  async switchCamera() {
    if (!this.localStream) return;

    const currentTrack = this.localStream.getVideoTracks()[0];

    if (!currentTrack) return;

    const cameras = await this.getCameras();

    if (cameras.length < 2) {
      return;
    }

    const currentId = currentTrack.getSettings().deviceId;

    const currentIndex = cameras.findIndex(
      (camera) => camera.deviceId === currentId,
    );

    const nextCamera = cameras[(currentIndex + 1) % cameras.length];

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: {
          exact: nextCamera.deviceId,
        },
      },
      audio: false,
    });

    const newTrack = stream.getVideoTracks()[0];

    await this.replaceTrack("video", newTrack);
  }

  /* ===========================================
    ENABLE AUDIO
=========================================== */

  setMuted(muted) {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });

    this.emit("mute_changed", {
      muted,
    });
  }

  /* ===========================================
    TOGGLE MUTE
=========================================== */

  toggleMute() {
    if (!this.localStream) return;

    const track = this.localStream.getAudioTracks()[0];

    if (!track) return;

    track.enabled = !track.enabled;

    this.emit("mute_changed", {
      muted: !track.enabled,
    });

    return !track.enabled;
  }

  /* ===========================================
    ENABLE VIDEO
=========================================== */

  setVideoEnabled(enabled) {
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });

    this.emit("video_changed", {
      enabled,
    });
  }

  /* ===========================================
    TOGGLE VIDEO
=========================================== */

  toggleVideo() {
    if (!this.localStream) return;

    const track = this.localStream.getVideoTracks()[0];

    if (!track) return;

    track.enabled = !track.enabled;

    this.emit("video_changed", {
      enabled: track.enabled,
    });

    return track.enabled;
  }

  /* ===========================================
    STREAM HELPERS
=========================================== */

  hasAudio() {
    return !!this.localStream?.getAudioTracks().length;
  }

  hasVideo() {
    return !!this.localStream?.getVideoTracks().length;
  }

  isMuted() {
    const track = this.localStream?.getAudioTracks()[0];

    return track ? !track.enabled : false;
  }

  isVideoEnabled() {
    const track = this.localStream?.getVideoTracks()[0];

    return track ? track.enabled : false;
  }
  /* ===========================================
    START CALL
=========================================== */

  async start(receiverId, type = "voice") {
    try {
      this.isCaller = true;
      this.callType = type;

      // Start the call
      const { call } = await startCall({
        receiverId,
        type,
      });

      this.call = call;
      this.callId = call.id;

      // Notify UI that we're ringing
      this.emit("calling", {
        call,
      });

      // Wait for "call_accepted" SSE event
      // createOffer() will be called from onAccepted()

      return call;
    } catch (err) {
      console.error("START CALL:", err);

      this.emit("error", {
        error: err,
      });

      throw err;
    }
  }

  async onAccepted() {
    if (!this.isCaller) return;

    if (!this.peer) {
      await this.createPeer();
    }

    if (!this.localStream) {
      await this.createLocalStream(this.callType === "video");
    }

    await this.createOffer();

    this.emit("call_accepted");
  }
  /* ===========================================
    ACCEPT CALL
=========================================== */

  async accept(video = false) {
    try {
      if (!this.callId) {
        throw new Error("Missing call id");
      }

      this.isCaller = false;

      this.callType = video ? "video" : "voice";

      await acceptCall({
        callId: this.callId,
      });

      await this.createPeer();

      await this.createLocalStream(video);

      this.emit("call_accepted");
    } catch (err) {
      console.error("ACCEPT:", err);

      this.emit("error", {
        error: err,
      });

      throw err;
    }
  }

  /* ===========================================
    REJECT CALL
=========================================== */

  async reject() {
    try {
      if (!this.callId) {
        return;
      }

      await rejectCall(this.callId);

      this.emit("call_rejected");

      this.cleanup();
    } catch (err) {
      console.error("REJECT:", err);

      this.emit("error", {
        error: err,
      });

      throw err;
    }
  }

  /* ===========================================
    END CALL
=========================================== */

  async end() {
    console.log("========== END ==========");
    console.log("Call ID:", this.callId);

    try {
      if (this.callId) {
        console.log("Sending /call/end");

        const res = await endCall({
          callId: this.callId,
        });

        console.log("END RESPONSE:", res);
      } else {
        console.log("No callId");
      }
    } catch (err) {
      console.error("END CALL:", err.response?.status, err.response?.data);
    } finally {
      this.cleanup();
      this.emit("call_ended");
    }
  }

  /* ===========================================
    CREATE OFFER
=========================================== */

  async createOffer() {
    if (!this.peer) {
      throw new Error("Peer not created");
    }

    const offer = await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: this.callType === "video",
    });

    await this.peer.setLocalDescription(offer);

    await sendOffer({
      callId: this.callId,
      offer,
    });

    return offer;
  }

  /* ===========================================
    CREATE ANSWER
=========================================== */

  async createAnswer() {
    console.log("========== CREATE ANSWER ==========");

    if (!this.peer) {
      throw new Error("Peer not created");
    }

    if (!this.callId) {
      throw new Error("Missing call ID");
    }

    try {
      console.log("Signaling state:", this.peer.signalingState);
      console.log("Remote description:", this.peer.remoteDescription?.type);

      console.log("Creating SDP answer...");

      const answer = await this.peer.createAnswer();

      console.log("Answer created.");

      console.log("Setting local description...");

      await this.peer.setLocalDescription(answer);

      console.log("Local description set:", this.peer.localDescription?.type);

      console.log("Sending answer to server...");

      const res = await sendAnswer({
        callId: this.callId,
        answer,
      });

      console.log("Answer sent:", res);

      this.emit("answer_sent", {
        call: this.call,
      });

      return answer;
    } catch (err) {
      console.error("========== CREATE ANSWER ERROR ==========");
      console.error("Call ID:", this.callId);
      console.error("Signaling state:", this.peer?.signalingState);
      console.error("Remote description:", this.peer?.remoteDescription);
      console.error("Local description:", this.peer?.localDescription);
      console.error("Response:", err.response?.data);
      console.error(err);

      this.emit("error", {
        error: err,
      });

      throw err;
    }
  }
  /* ===========================================
    RECEIVE OFFER
=========================================== */

  async receiveOffer(call, offer) {
    try {
      console.log("========== RECEIVE OFFER ==========");
      console.log("Call ID:", call?.id);
      console.log("Peer exists:", !!this.peer);
      console.log("Local stream:", !!this.localStream);

      if (!offer) {
        throw new Error("Missing SDP offer");
      }

      this.call = call;
      this.callId = call.id;
      this.callType = call.type;
      this.isCaller = false;

      if (!this.peer) {
        console.log("Creating peer...");
        await this.createPeer();
      }

      if (!this.localStream) {
        console.log("Creating local stream...");
        await this.createLocalStream(call.type === "video");
      }

      console.log("Signaling state:", this.peer.signalingState);
      console.log("Remote description:", !!this.peer.remoteDescription);

      // Ignore duplicate offers
      if (
        this.peer.signalingState !== "stable" ||
        this.peer.remoteDescription
      ) {
        console.warn("Ignoring duplicate offer.");
        return;
      }

      console.log("Setting remote description...");

      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));

      console.log("Remote description set.");

      /* ==========================
       PROCESS PENDING ICE
    ========================== */

      if (!this.pendingCandidates) {
        this.pendingCandidates = [];
      }

      console.log(`Pending ICE candidates: ${this.pendingCandidates.length}`);

      while (this.pendingCandidates.length) {
        const candidate = this.pendingCandidates.shift();

        try {
          await this.peer.addIceCandidate(new RTCIceCandidate(candidate));

          console.log("Added pending ICE:", candidate);
        } catch (err) {
          console.error("Pending ICE failed:", err);
        }
      }

      console.log("Creating answer...");

      await this.createAnswer();

      console.log("Answer created and sent.");

      this.emit("offer_received", {
        call,
      });
    } catch (err) {
      console.error("========== RECEIVE OFFER ERROR ==========");
      console.error(err);

      this.emit("error", {
        error: err,
      });

      throw err;
    }
  }

  /* ===========================================
    RECEIVE ANSWER
=========================================== */

  async receiveAnswer(answer) {
    try {
      console.log("========== RECEIVE ANSWER ==========");

      if (!this.peer) {
        throw new Error("Peer not created");
      }

      if (!answer) {
        throw new Error("Missing SDP answer");
      }

      console.log("Signaling state:", this.peer.signalingState);

if (this.peer.remoteDescription) {
      console.warn("Ignoring duplicate answer.");
      return;
    }

    if (!this.peer.localDescription) {
      console.warn("Ignoring answer because local description is missing.");
        return;
      }

      console.log("Setting remote description...");

      await this.peer.setRemoteDescription(new RTCSessionDescription(answer));

      console.log("Remote description set.");

      /* ==========================
       PROCESS PENDING ICE
    ========================== */

      if (!this.pendingCandidates) {
        this.pendingCandidates = [];
      }

      console.log(`Pending ICE candidates: ${this.pendingCandidates.length}`);

      while (this.pendingCandidates.length) {
        const candidate = this.pendingCandidates.shift();

        try {
          await this.peer.addIceCandidate(new RTCIceCandidate(candidate));

          console.log("Added pending ICE:", candidate);
        } catch (err) {
          console.error("Failed to add pending ICE:", err);
        }
      }

      console.log("Pending ICE processed.");

      this.emit("call_connected", {
        call: this.call,
      });
    } catch (err) {
      console.error("========== RECEIVE ANSWER ERROR ==========");
      console.error(err);

      this.emit("error", {
        error: err,
      });

      throw err;
    }
  }

  /* ===========================================
    RECEIVE ICE
=========================================== */

  async receiveIceCandidate(candidate) {
    try {
      if (!candidate) {
        return;
      }

      if (!this.pendingCandidates) {
        this.pendingCandidates = [];
      }

      if (!this.peer) {
        this.pendingCandidates.push(candidate);
        return;
      }

      // Wait until remote description is set
      if (!this.peer.remoteDescription) {
        this.pendingCandidates.push(candidate);
        return;
      }

      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));

      console.log("ICE candidate added");
    } catch (err) {
      console.error("RECEIVE ICE:", err);

      this.emit("error", {
        error: err,
      });
    }
  }

  /* ===========================================
    REMOTE HANGUP
=========================================== */

  remoteEnded() {
    this.cleanup();

    this.emit("call_ended");
  }

  /* ===========================================
    RESET
=========================================== */

  resetState() {
    this.call = null;

    this.callId = null;

    this.callType = "voice";

    this.isCaller = false;

    this.connectionState = "new";

    this.signalingState = "stable";

    this.iceConnectionState = "new";
  }

  async cancel() {
    if (!this.callId) return;

    try {
      await endCall({
        callId: this.callId,
      });

      this.emit("call_cancelled", {
        callId: this.callId,
      });

      this.cleanup();
    } catch (err) {
      console.error("Cancel call failed:", err);
      throw err;
    }
  }

  /* ===========================================
    CLEANUP
=========================================== */

  cleanup() {
    console.log("========== CLEANUP ==========");
    console.log("Call ID:", this.callId);

    /* ==========================
     PEER
  ========================== */

    if (this.peer) {
      this.peer.ontrack = null;
      this.peer.onicecandidate = null;
      this.peer.onconnectionstatechange = null;
      this.peer.oniceconnectionstatechange = null;
      this.peer.onsignalingstatechange = null;
      this.peer.onnegotiationneeded = null;
      this.peer.ondatachannel = null;

      this.peer.getSenders().forEach((sender) => {
        try {
          sender.replaceTrack(null);
        } catch (err) {
          console.warn("replaceTrack:", err);
        }
      });

      try {
        this.peer.close();
      } catch (err) {
        console.warn("peer.close:", err);
      }

      this.peer = null;
    }

    /* ==========================
     LOCAL STREAM
  ========================== */

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    /* ==========================
     REMOTE STREAM
  ========================== */

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    /* ==========================
     RESET STATE
  ========================== */

    this.pendingCandidates = [];

    // Keep the values until the very end for debugging
    const oldCall = this.call;
    const oldCallId = this.callId;

    this.call = null;
    this.callId = null;
    this.callType = "voice";
    this.isCaller = false;

    this.connectionState = "new";
    this.signalingState = "stable";
    this.iceConnectionState = "new";

    this.resetState();

    console.log("Cleanup complete:", oldCallId);

    this.emit("cleanup", {
      call: oldCall,
      callId: oldCallId,
    });
  }

  /* ===========================================
    DESTROY
=========================================== */

  destroy() {
    this.cleanup();

    this.listeners.clear();
  }
}

export default new CallService();
