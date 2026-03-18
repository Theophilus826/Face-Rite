import { useState } from "react";
import { generateDepositAccount } from "../features/Api";

const amounts = [2000, 3000, 5000, 10000, 20000, 50000, 100000, 200000];

const methods = [
  { id: "ngn", name: "Bank Transfer" },
  { id: "paga", name: "Paga" },
  { id: "palmpay", name: "PalmPay" },
];

export default function DepositPanel() {
  const [selectedMethod, setSelectedMethod] = useState("ngn");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);

  const handleDeposit = async () => {
    if (!amount || amount < 2000) {
      alert("Minimum deposit is ₦2,000");
      return;
    }

    try {
      setLoading(true);
      const res = await generateDepositAccount(selectedMethod);
      setAccount(res);
    } catch (err) {
      console.error(err);
      alert("Failed to generate deposit account");
    } finally {
      setLoading(false);
    }
  };

  const copyAccount = () => {
    if (account?.accountNumber) {
      navigator.clipboard.writeText(account.accountNumber);
      alert("Account number copied");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">

        <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900">
          Deposit
        </h2>

        {/* Payment Method */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Payment method</p>
          <div className="flex gap-3">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold transition
                ${
                  selectedMethod === method.id
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white/40 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/60"
                }`}
              >
                {method.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {amounts.map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              className={`p-3 rounded-lg text-sm font-semibold transition
              ${
                amount === amt
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white/40 backdrop-blur-sm border border-white/40 hover:bg-white/60"
              }`}
            >
              ₦{amt.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <input
          type="number"
          placeholder="Enter custom amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition mb-5"
        />

        {/* Deposit Button */}
        {!account && (
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400"
          >
            {loading ? "Generating account..." : "Deposit Now"}
          </button>
        )}

        {/* Account Details */}
        {account && (
          <div className="mt-6 p-5 rounded-xl bg-white/40 backdrop-blur-sm border border-white/40">
            <p className="text-sm text-gray-600 mb-3">
              {selectedMethod === "palmpay"
                ? "Transfer using PalmPay to this account"
                : "Transfer using your selected payment provider"}
            </p>

            <p className="text-sm">
              <b>Bank:</b> {account.bankName}
            </p>

            <p className="text-sm">
              <b>Account Name:</b> {account.accountName}
            </p>

            <p className="text-xl font-bold mt-2 text-gray-900">
              {account.accountNumber}
            </p>

            <button
              onClick={copyAccount}
              className="mt-3 text-sm text-blue-500 hover:underline"
            >
              Copy Account Number
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 text-center">
          Minimum deposit ₦2,000
        </p>
      </div>
    </div>
  );
}