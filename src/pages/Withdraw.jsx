import { useDispatch, useSelector } from "react-redux";
import { withdrawCoins } from "../features/coins/CoinSlice";
import { useState, useEffect } from "react";

export default function Withdraw() {
  const dispatch = useDispatch();
  const { balance, status } = useSelector((state) => state.coins);

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NEW

  // ===============================
  // Handle Withdraw
  // ===============================
  const handleWithdraw = async () => {
    setMessage("");

    if (!amount || amount <= 0) {
      return setMessage("Enter a valid amount");
    }

    if (amount < 1000) {
      return setMessage("Minimum withdrawal is ₦1,000");
    }

    if (amount > balance) {
      return setMessage("Insufficient balance");
    }

    if (!accountNumber || accountNumber.length < 10) {
      return setMessage("Enter a valid account number");
    }

    if (!bankName) {
      return setMessage("Enter bank name");
    }

    setIsSubmitting(true); // 🔥 START loading

    try {
      await dispatch(
        withdrawCoins({
          amount: Number(amount),
          accountNumber,
          bankName,
        })
      ).unwrap(); // ✅ ensures proper success/failure handling
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false); // 🔥 STOP loading
    }
  };

  // ===============================
  // Reset form on success
  // ===============================
  useEffect(() => {
    if (status === "succeeded") {
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setMessage("✅ Withdrawal request sent successfully");
    }

    if (status === "failed") {
      setMessage("❌ Withdrawal failed. Try again.");
    }
  }, [status]);

  // combine redux + local loading (best UX)
  const isLoading = status === "loading" || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">

        <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900">
          Withdraw
        </h2>

        {/* Balance */}
        <p className="text-sm mb-4 text-gray-700 text-center">
          Balance: <b>₦{balance?.toLocaleString() ?? 0}</b>
        </p>

        {/* Message */}
        {message && (
          <p className={`text-sm text-center mb-4 ${
            message.includes("✅") ? "text-green-600" : "text-red-500"
          }`}>
            {message}
          </p>
        )}

        {/* Form */}
        <div className="flex flex-col gap-4">

          {/* Amount */}
          <input
            type="number"
            placeholder="Amount (₦)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          {/* Account Number */}
          <input
            type="text"
            placeholder="Account Number"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, ""))
            }
            maxLength={10}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          {/* Bank Name */}
          <input
            type="text"
            placeholder="Bank Name (e.g. Access Bank)"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          {/* Button */}
          <button
            onClick={handleWithdraw}
            disabled={isLoading}
            className="mt-2 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400"
          >
            {isLoading ? "Processing..." : "Withdraw"}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          Minimum withdrawal ₦1,000
        </p>
      </div>
    </div>
  );
}