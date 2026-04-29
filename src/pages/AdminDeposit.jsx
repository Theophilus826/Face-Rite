import { useEffect, useRef, useState } from "react";
import API from "../features/Api";

export default function AdminDeposit() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const prevIdsRef = useRef([]);
  const highlightTimerRef = useRef(null);

  // ===============================
  // FETCH DEPOSITS
  // ===============================
  const fetchDeposits = async () => {
    try {
      const res = await API.get("/admin/deposits/pending");
      const data = res.data;

      const currentIds = data.map((d) => d._id);

      const newIdsDetected = currentIds.filter(
        (id) => !prevIdsRef.current.includes(id),
      );

      if (newIdsDetected.length > 0) {
        setNewIds(newIdsDetected);

        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current);
        }

        highlightTimerRef.current = setTimeout(() => {
          setNewIds([]);
        }, 3000);
      }

      prevIdsRef.current = currentIds;
      setDeposits(data);
    } catch (err) {
      console.error("❌ Fetch deposits error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // AUTO REFRESH
  // ===============================
  useEffect(() => {
    fetchDeposits();

    const interval = setInterval(fetchDeposits, 5000);

    return () => {
      clearInterval(interval);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // ===============================
  // APPROVE
  // ===============================
  const approve = async (id) => {
    setActionLoading(id);

    const prev = deposits;

    // optimistic UI
    setDeposits((p) =>
      p.map((d) =>
        d._id === id
          ? { ...d, status: "COMPLETED", reviewStatus: "APPROVED" }
          : d,
      ),
    );

    try {
      await API.put(`/admin/deposits/approve/${id}`);
    } catch (err) {
      console.error("❌ Approve failed:", err);
      alert("Approve failed");
      setDeposits(prev);
    } finally {
      setActionLoading(null);
    }
  };

  // ===============================
  // REJECT
  // ===============================
  const reject = async (id) => {
    const reason = prompt("Reason for rejection?");
    if (!reason) return;

    setActionLoading(id);

    const prev = deposits;

    // optimistic UI
    setDeposits((p) =>
      p.map((d) =>
        d._id === id ? { ...d, status: "FAILED", reviewStatus: "REJECTED" } : d,
      ),
    );

    try {
      await API.put(`/admin/deposits/reject/${id}`, { reason });
    } catch (err) {
      console.error("❌ Reject failed:", err);
      alert("Reject failed");
      setDeposits(prev);
    } finally {
      setActionLoading(null);
    }
  };

  // ===============================
  // UI
  // ===============================
  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🔴 Live Admin Dashboard</h1>

      <div className="space-y-4">
        {deposits.map((d) => {
          const isNew = newIds.includes(d._id);

          return (
            <div
              key={d._id}
              className={`p-4 rounded-xl border shadow transition-all duration-300
                ${isNew ? "bg-green-100 border-green-400" : "bg-white"}
              `}
            >
              {/* USER INFO */}
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">
                    {d.user?.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-500">{d.user?.email}</p>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded ${
                    d.status === "COMPLETED"
                      ? "bg-green-200 text-green-700"
                      : d.status === "FAILED"
                        ? "bg-red-200 text-red-700"
                        : "bg-orange-200 text-orange-700"
                  }`}
                >
                  {d.status}
                </span>
              </div>

              {/* DETAILS */}
              <div className="mt-2 text-sm">
                <p>
                  <b>Amount:</b> ₦{d.expectedAmount}
                </p>
                <p>
                  <b>Bank:</b> {d.bankName || "N/A"}
                </p>
                <p>
                  <b>Method:</b> {d.method}
                </p>
              </div>

              {/* RECEIPT */}
              {(d.receipt || d.paymentData?.receiptUrl) && (
                <a
                  href={d.receipt || d.paymentData?.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 text-sm underline mt-2 inline-block"
                >
                  View Receipt
                </a>
              )}

              {/* ACTIONS */}
              <div className="flex gap-3 mt-3">
                <button
                  disabled={actionLoading === d._id}
                  onClick={() => approve(d._id)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {actionLoading === d._id ? "..." : "Approve"}
                </button>

                <button
                  disabled={actionLoading === d._id}
                  onClick={() => reject(d._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading === d._id ? "..." : "Reject"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
