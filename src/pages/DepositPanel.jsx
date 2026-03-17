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

      // Pass the selected payment method to backend
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
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-5">
      <h2 className="text-xl font-bold mb-4">Deposit</h2>

      {/* Payment Method */}
      <div className="mb-5">
        <p className="text-sm text-gray-500 mb-2">Payment method</p>
        <div className="flex gap-3">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium
              ${
                selectedMethod === method.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300"
              }`}
            >
              {method.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Amounts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {amounts.map((amt) => (
          <button
            key={amt}
            onClick={() => setAmount(amt)}
            className={`p-3 rounded-lg border text-sm font-semibold
            ${
              amount === amt
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300"
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
        className="w-full border rounded-lg p-3 mb-4"
      />

      {/* Deposit Button */}
      {!account && (
        <button
          onClick={handleDeposit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          {loading ? "Generating account..." : "Deposit Now"}
        </button>
      )}

      {/* Virtual Account Details */}
      {account && (
        <div className="mt-5 border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">
            {selectedMethod === "palmpay"
              ? "Transfer the exact amount using PalmPay to this virtual account"
              : "Transfer the exact amount using your selected payment provider"}
          </p>

          <p className="text-sm">
            <b>Bank:</b> {account.bankName}
          </p>

          <p className="text-sm">
            <b>Account Name:</b> {account.accountName}
          </p>

          <p className="text-lg font-bold mt-1">{account.accountNumber}</p>

          <button
            onClick={copyAccount}
            className="mt-2 text-sm text-blue-600"
          >
            Copy Account Number
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        Min deposit ₦2,000
      </p>
    </div>
  );
}