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
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
      ],
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

    this.peer = new RTCPeerConnection(configuration);

    this.registerPeerEvents();

    return this.peer;
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
      if (!event.candidate || !this.callId) {
        return;
      }

      try {
        await sendIceCandidate(
          this.callId,
          event.candidate
        );
      } catch (err) {
        console.error("ICE:", err);
      }
    };

    /* ---------- Connection ---------- */

    this.peer.onconnectionstatechange = () => {
      this.connectionState =
        this.peer.connectionState;

      this.emit("connection_state", {
        state: this.connectionState,
      });

      switch (this.connectionState) {
        case "connected":
          this.emit("call_connected");
          break;

        case "failed":
        case "closed":
        case "disconnected":
          this.cleanup();
          break;

        default:
          break;
      }
    };

    /* ---------- ICE Connection ---------- */

    this.peer.oniceconnectionstatechange = () => {
      this.iceConnectionState =
        this.peer.iceConnectionState;

      this.emit("ice_state", {
        state: this.iceConnectionState,
      });
    };

    /* ---------- ICE Gathering ---------- */

    this.peer.onicegatheringstatechange = () => {
      this.emit("ice_gathering_state", {
        state: this.peer.iceGatheringState,
      });
    };

    /* ---------- Signaling ---------- */

    this.peer.onsignalingstatechange = () => {
      this.signalingState =
        this.peer.signalingState;

      this.emit("signaling_state", {
        state: this.signalingState,
      });
    };

    /* ---------- Negotiation ---------- */

    this.peer.onnegotiationneeded = () => {
      this.emit("negotiation_needed");
    };

    /* ---------- Data Channel ---------- */

    this.peer.ondatachannel = (event) => {
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
  await this.createPeer();

  if (this.localStream) {
    return this.localStream;
  }

  this.callType = video ? "video" : "voice";

  this.localStream =
    await navigator.mediaDevices.getUserMedia({
      audio: true,
      video,
    });

  this.localStream.getTracks().forEach((track) => {
    this.peer.addTrack(
      track,
      this.localStream
    );
  });

  this.emit("local_stream", {
    stream: this.localStream,
  });

  return this.localStream;
}

/* ===========================================
    REPLACE TRACK
=========================================== */

async replaceTrack(kind, newTrack) {
  if (!this.peer) return;

  const sender =
    this.peer
      .getSenders()
      .find(
        (sender) =>
          sender.track?.kind === kind
      );

  if (!sender) return;

  await sender.replaceTrack(newTrack);

  if (!this.localStream) return;

  const oldTrack =
    this.localStream
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
  const devices =
    await this.getDevices();

  return devices.filter(
    (device) =>
      device.kind === "videoinput"
  );
}

async getMicrophones() {
  const devices =
    await this.getDevices();

  return devices.filter(
    (device) =>
      device.kind === "audioinput"
  );
}

/* ===========================================
    SWITCH CAMERA
=========================================== */

async switchCamera() {
  if (!this.localStream) return;

  const currentTrack =
    this.localStream.getVideoTracks()[0];

  if (!currentTrack) return;

  const cameras =
    await this.getCameras();

  if (cameras.length < 2) {
    return;
  }

  const currentId =
    currentTrack.getSettings().deviceId;

  const currentIndex =
    cameras.findIndex(
      (camera) =>
        camera.deviceId === currentId
    );

  const nextCamera =
    cameras[
      (currentIndex + 1) %
        cameras.length
    ];

  const stream =
    await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: {
          exact:
            nextCamera.deviceId,
        },
      },
      audio: false,
    });

  const newTrack =
    stream.getVideoTracks()[0];

  await this.replaceTrack(
    "video",
    newTrack
  );
}

/* ===========================================
    ENABLE AUDIO
=========================================== */

setMuted(muted) {
  if (!this.localStream) return;

  this.localStream
    .getAudioTracks()
    .forEach((track) => {
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

  const track =
    this.localStream.getAudioTracks()[0];

  if (!track) return;

  track.enabled =
    !track.enabled;

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

  this.localStream
    .getVideoTracks()
    .forEach((track) => {
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

  const track =
    this.localStream.getVideoTracks()[0];

  if (!track) return;

  track.enabled =
    !track.enabled;

  this.emit("video_changed", {
    enabled: track.enabled,
  });

  return track.enabled;
}

/* ===========================================
    STREAM HELPERS
=========================================== */

hasAudio() {
  return !!this.localStream?.getAudioTracks()
    .length;
}

hasVideo() {
  return !!this.localStream?.getVideoTracks()
    .length;
}

isMuted() {
  const track =
    this.localStream
      ?.getAudioTracks()[0];

  return track
    ? !track.enabled
    : false;
}

isVideoEnabled() {
  const track =
    this.localStream
      ?.getVideoTracks()[0];

  return track
    ? track.enabled
    : false;
}
  /* ===========================================
    START CALL
=========================================== */

async start(receiverId, type = "voice") {
  try {
    this.isCaller = true;
    this.callType = type;

    const { call } = await startCall({
      receiverId,
      type,
    });

    this.call = call;
    this.callId = call.id;

    await this.createPeer();

    await this.createLocalStream(
      type === "video"
    );

    this.emit("calling", {
      call,
    });

    await this.createOffer();

    return call;
  } catch (err) {
    console.error("START CALL:", err);

    this.emit("error", {
      error: err,
    });

    throw err;
  }
}

/* ===========================================
    ACCEPT CALL
=========================================== */

async accept(video = false) {
  try {
    if (!this.callId) {
      throw new Error(
        "Missing call id"
      );
    }

    this.isCaller = false;

    this.callType = video
      ? "video"
      : "voice";

    await acceptCall({
      callId: this.callId,
    });

    await this.createPeer();

    await this.createLocalStream(
      video
    );

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

    await rejectCall({
      callId: this.callId,
    });

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
  try {
    if (this.callId) {
      await endCall({
        callId: this.callId,
      });
    }

    this.emit("call_ended");

    this.cleanup();
  } catch (err) {
    console.error("END:", err);

    this.emit("error", {
      error: err,
    });

    throw err;
  }
}

/* ===========================================
    CREATE OFFER
=========================================== */

async createOffer() {
  if (!this.peer) {
    throw new Error(
      "Peer not created"
    );
  }

  const offer =
    await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo:
        this.callType === "video",
    });

  await this.peer.setLocalDescription(
    offer
  );

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
  if (!this.peer) {
    throw new Error(
      "Peer not created"
    );
  }

  const answer =
    await this.peer.createAnswer();

  await this.peer.setLocalDescription(
    answer
  );

  await sendAnswer({
    callId: this.callId,
    answer,
  });

  return answer;
}
/* ===========================================
    RECEIVE OFFER
=========================================== */

async receiveOffer(call, offer) {
  try {
    this.call = call;
    this.callId = call.id;
    this.callType = call.type;
    this.isCaller = false;

    await this.createPeer();

    if (!this.localStream) {
      await this.createLocalStream(
        call.type === "video"
      );
    }

    await this.peer.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    await this.createAnswer();

    this.emit("offer_received", {
      call,
    });

  } catch (err) {
    console.error("RECEIVE OFFER:", err);

    this.emit("error", {
      error: err,
    });
  }
}

/* ===========================================
    RECEIVE ANSWER
=========================================== */

async receiveAnswer(answer) {
  try {
    if (!this.peer) return;

    await this.peer.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    this.emit("call_connected");

  } catch (err) {
    console.error("ANSWER:", err);

    this.emit("error", {
      error: err,
    });
  }
}

/* ===========================================
    RECEIVE ICE
=========================================== */

async receiveIceCandidate(candidate) {
  try {
    if (!this.peer) return;

    if (!candidate) return;

    await this.peer.addIceCandidate(
      new RTCIceCandidate(candidate)
    );

  } catch (err) {
    console.error("ICE:", err);
  }
}

/* ===========================================
    REMOTE HANGUP
=========================================== */

remoteEnded() {
  this.emit("call_ended");

  this.cleanup();
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
    await endCall(this.callId);

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
      } catch (_) {}
    });

    this.peer.close();

    this.peer = null;
  }

  if (this.localStream) {

    this.localStream
      .getTracks()
      .forEach((track) => {
        track.stop();
      });

    this.localStream = null;
  }

  if (this.remoteStream) {

    this.remoteStream
      .getTracks()
      .forEach((track) => {
        track.stop();
      });

    this.remoteStream = null;
  }

  this.resetState();

  this.emit("cleanup");
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