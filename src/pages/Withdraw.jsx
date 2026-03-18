import { useDispatch, useSelector } from "react-redux";
import { withdrawCoins } from "../features/coins/CoinSlice";
import { useState } from "react";

export default function Withdraw() {
  const dispatch = useDispatch();
  const { balance, status } = useSelector((state) => state.coins);

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleWithdraw = () => {
    if (!amount || amount <= 0) return alert("Enter valid amount");
    if (amount > balance) return alert("Insufficient balance");

    dispatch(
      withdrawCoins({
        amount: Number(amount),
        accountNumber,
        bankName,
      })
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900">
          Withdraw
        </h2>

        <p className="text-sm mb-4 text-gray-700">
          Balance: ₦{balance?.toLocaleString() ?? 0}
        </p>

        <div className="flex flex-col gap-4">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
          />
          <input
            type="text"
            placeholder="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
          />
          <input
            type="text"
            placeholder="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
          />
          <button
            onClick={handleWithdraw}
            disabled={status === "loading"}
            className="mt-2 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400"
          >
            {status === "loading" ? "Processing..." : "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}