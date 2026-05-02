import { useEffect, useState, useCallback } from "react";
import axios from "axios";

// ===============================
// AXIOS INSTANCE (✅ FIXED BACKEND)
// ===============================
const API = axios.create({
  baseURL: "https://swordgame-5.onrender.com", // ✅ CORRECT BACKEND
  headers: {
    "Content-Type": "application/json",
  },
});

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // ===============================
  // AUTH CONFIG
  // ===============================
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // ===============================
  // FETCH WITHDRAWALS
  // ===============================
  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(
        `/api/admin/withdrawals?status=${statusFilter}&search=${search}`,
        getAuthConfig()
      );

      // 🔥 SAFETY: detect wrong server (HTML instead of JSON)
      if (typeof res.data === "string") {
        throw new Error("Wrong API URL (returned HTML instead of JSON)");
      }

      console.log("✅ API RESPONSE:", res.data);

      setWithdrawals(res.data.withdrawals || []);
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      console.log("❌ RESPONSE:", err.response);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch withdrawals"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  // ===============================
  // LOAD ON MOUNT
  // ===============================
  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // ===============================
  // SEARCH DEBOUNCE
  // ===============================
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchWithdrawals();
    }, 400);

    return () => clearTimeout(delay);
  }, [search, fetchWithdrawals]);

  // ===============================
  // ACTIONS
  // ===============================
  const approve = async (id) => {
    try {
      await API.put(
        `/api/admin/withdrawals/approve/${id}`,
        {},
        getAuthConfig()
      );

      fetchWithdrawals();
    } catch (err) {
      console.error("❌ APPROVE ERROR:", err);
      alert(err.response?.data?.message || "Approval failed");
    }
  };

  const reject = async (id) => {
    const reason = prompt("Enter rejection reason");
    if (!reason) return;

    try {
      await API.put(
        `/api/admin/withdrawals/reject/${id}`,
        { reason },
        getAuthConfig()
      );

      fetchWithdrawals();
    } catch (err) {
      console.error("❌ REJECT ERROR:", err);
      alert(err.response?.data?.message || "Rejection failed");
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Withdrawal Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search user, bank, account"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full md:w-1/3"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <button
          onClick={fetchWithdrawals}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 mb-3 text-sm text-center">{error}</p>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Bank</th>
              <th className="p-2 border">Account</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : withdrawals.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  No withdrawals found
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w._id} className="text-center">
                  <td className="border p-2">
                    {w.userName || "Unknown"}
                  </td>

                  <td className="border p-2">
                    ₦{Number(w.amount || 0).toLocaleString()}
                  </td>

                  <td className="border p-2">{w.bankName}</td>

                  <td className="border p-2">{w.accountNumber}</td>

                  <td className="border p-2">
                    <span
                      className={
                        w.status === "PENDING"
                          ? "text-yellow-600"
                          : w.status === "APPROVED"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {w.status}
                    </span>
                  </td>

                  <td className="border p-2">
                    {new Date(w.createdAt).toLocaleString()}
                  </td>

                  <td className="border p-2 flex gap-2 justify-center">
                    {w.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => approve(w._id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => reject(w._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}