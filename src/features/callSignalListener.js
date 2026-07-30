import callService from "./CallService";

class CallSignalListener {
  constructor() {
    this.eventSource = null;
  }

  connect(userId) {
    if (this.eventSource) {
      return;
    }

    const token = localStorage.getItem("token");

    this.eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/call/events?token=${token}`
    );

    this.eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        await this.handle(data);

      } catch (err) {
        console.error(err);
      }
    };

    this.eventSource.onerror = () => {
      console.log("Call SSE disconnected");

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

        callService.emit(
          "incoming_call",
          {
            call: event.call,
          }
        );

        break;

      /* ===========================
          Accepted
      =========================== */

      case "call_accepted":

        callService.emit(
          "call_accepted"
        );

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

      case "ice_candidate":

        await callService.receiveIceCandidate(
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

        callService.emit(
          "call_rejected"
        );

        break;

      /* ===========================
          Timeout
      =========================== */

      case "call_timeout":

        callService.cleanup();

        callService.emit(
          "call_timeout"
        );

        break;

      default:
        break;
    }
  }
}

export default new CallSignalListener();