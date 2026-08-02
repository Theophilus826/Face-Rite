import callService from "./callService";

class CallSignalListener {
  constructor() {
    this.eventSource = null;
  }

  connect(userId) {
    if (this.eventSource) return;

    const token = localStorage.getItem("token");

    const url = `https://swordgame-5.onrender.com/api/call/events?token=${token}`;

    console.log("Connecting SSE:", url);

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log("✅ Call SSE connected");
    };

    this.eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log("SSE Event:", data);

        await this.handle(data);
      } catch (err) {
        console.error("SSE Parse Error:", err);
      }
    };

    this.eventSource.onerror = (err) => {
      console.error("❌ Call SSE disconnected", err);

      this.disconnect();

      setTimeout(() => {
        this.connect(userId);
      }, 3000);
    };
  }

  disconnect() {
    if (!this.eventSource) return;

    this.eventSource.close();
    this.eventSource = null;
  }

  async handle(event) {
    switch (event.type) {

      /* ===========================
          Incoming Call
      =========================== */

      case "incoming_call":
        callService.call = event.call;
        callService.callId = event.call.id;
        callService.callType = event.call.type;
        callService.isCaller = false;

        callService.emit("incoming_call", {
          call: event.call,
        });

        break;

      /* ===========================
          Accepted
      =========================== */

      case "call_accepted":
        await callService.onAccepted();
        break;

      /* ===========================
          Offer
      =========================== */

      case "offer":
        await callService.receiveOffer(
          event.call,
          event.offer
        );
        break;

      /* ===========================
          Answer
      =========================== */

      case "answer":
        await callService.receiveAnswer(
          event.answer
        );
        break;

      /* ===========================
          ICE
      =========================== */

      case "ice_candidate":      case "ice":        await callService.receiveIceCandidate(
          event.candidate
        );
        break;

      /* ===========================
          End
      =========================== */

      case "call_ended":
        callService.remoteEnded();
        break;

      /* ===========================
          Reject
      =========================== */

      case "call_rejected":
        callService.cleanup();
        callService.emit("call_rejected");
        break;

      /* ===========================
          Timeout
      =========================== */

      case "call_timeout":
        callService.cleanup();
        callService.emit("call_timeout");
        break;

      default:
        console.log("Unknown SSE event:", event);
        break;
    }
  }
}

export default new CallSignalListener();