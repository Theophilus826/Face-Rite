import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { creditCoins, fetchTransactions } from "../features/coins/AdminSlice";

export default function AdminCreditCoins() {
  const dispatch = useDispatch();

  // -------------------- Redux State --------------------
  const {
    transactions = [],
    isLoading = false,
    loadingTransactions = false,
  } = useSelector((state) => state.admin || {});

  const loading = isLoading || loadingTransactions;

  // -------------------- Credit/Debit State --------------------
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState("credit"); // credit or debit
  const [description, setDescription] = useState("");
  const [coinLoading, setCoinLoading] = useState(false);

  // -------------------- Filters --------------------
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // -------------------- Fetch Transactions --------------------
  const loadTransactions = async () => {
    try {
      await dispatch(fetchTransactions({ search, type: typeFilter })).unwrap();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load transactions");
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // -------------------- Submit Credit/Debit --------------------
  const handleCoinSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return toast.error("User ID is required");
    if (Number(amount) <= 0) return toast.error("Amount must be > 0");

    setCoinLoading(true);

    try {
      const finalAmount = action === "debit" ? -Math.abs(Number(amount)) : Number(amount);

      await dispatch(
        creditCoins({ winnerId: userId, amount: finalAmount, description })
      ).unwrap();

      toast.success(action === "credit" ? "Coins credited 💰" : "Coins debited 💸");

      setUserId("");
      setAmount("");
      setDescription("");
      setAction("credit");

      loadTransactions();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || err?.response?.data?.message || "Operation failed");
    } finally {
      setCoinLoading(false);
    }
  };

  // -------------------- Handle Filter --------------------
  const handleFilter = (e) => {
    e.preventDefault();
    loadTransactions();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">Admin Control Panel 🛠</h1>

      {/* Credit/Debit Coins */}
      <section className="bg-neutral-900 p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold">Credit / Debit Coins</h2>
        <form onSubmit={handleCoinSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 rounded bg-black border border-neutral-700"
            required
          />

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 p-2 rounded bg-black border border-neutral-700"
              min="1"
              required
            />
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="p-2 rounded bg-black border border-neutral-700"
            >
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded bg-black border border-neutral-700"
          />

          <button
            disabled={coinLoading}
            className="w-full bg-green-600 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {coinLoading
              ? action === "credit"
                ? "Crediting..."
                : "Debiting..."
              : action === "credit"
              ? "Credit Coins 💰"
              : "Debit Coins 💸"}
          </button>
        </form>
      </section>

      {/* Transaction History */}
      <section className="bg-neutral-900 p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold">Transaction History</h2>

        {/* Filters */}
        <form onSubmit={handleFilter} className="flex gap-2 flex-wrap mb-3">
          <input
            type="text"
            placeholder="Search reference ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 rounded bg-black border border-neutral-700 flex-1 min-w-[200px]"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 rounded bg-black border border-neutral-700"
          >
            <option value="">All Types</option>
            <option value="ADMIN_CREDIT">Admin Credit</option>
            <option value="ADMIN_DEBIT">Admin Debit</option>
            <option value="LOGIN">Login</option>
            <option value="PURCHASE">Purchase</option>
            <option value="REWARD">Reward</option>
            <option value="REFUND">Refund</option>
          </select>
          <button type="submit" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Filter
          </button>
        </form>

        {loading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-neutral-700 text-left">
              <thead>
                <tr className="bg-black/40">
                  <th className="px-3 py-2 border-b">User</th>
                  <th className="px-3 py-2 border-b">Amount</th>
                  <th className="px-3 py-2 border-b">Type</th>
                  <th className="px-3 py-2 border-b">Description</th>
                  <th className="px-3 py-2 border-b">Performed By</th>
                  <th className="px-3 py-2 border-b">Reference ID</th>
                  <th className="px-3 py-2 border-b">Date</th>
                  <th className="px-3 py-2 border-b">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="odd:bg-black/20">
                    <td className="px-3 py-2 border-b">{tx.user?.username || tx.user?._id}</td>
                    <td className="px-3 py-2 border-b">{tx.amount}</td>
                    <td className="px-3 py-2 border-b">{tx.type}</td>
                    <td className="px-3 py-2 border-b">{tx.description || "-"}</td>
                    <td className="px-3 py-2 border-b">{tx.performedBy?.username || "-"}</td>
                    <td className="px-3 py-2 border-b">{tx.referenceId || "-"}</td>
                    <td className="px-3 py-2 border-b">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 border-b">{tx.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
