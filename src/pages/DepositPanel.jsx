import { useState, useEffect } from "react";
import { generateDepositAccount, getWalletBalance } from "../features/Api";

const amounts = [2000, 3000, 5000, 10000, 20000, 50000, 100000, 200000];

export default function DepositPanel() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [wallet, setWallet] = useState(null);

  // ===============================
  // Handle Deposit
  // ===============================
  const handleDeposit = async () => {
  if (!amount || amount < 100) {
    alert("Minimum deposit is ₦100");
    return;
  }

  try {
    setLoading(true);
    const res = await fetch("/api/deposit/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }), // ← send amount
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed");

    setAccount(data);
    setWaiting(true);

  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  // ===============================
  // Auto Wallet Refresh (Polling)
  // ===============================
  useEffect(() => {
    let interval;

    if (account && waiting) {
      interval = setInterval(async () => {
        try {
          const updatedWallet = await getWalletBalance();
          setWallet(updatedWallet);

          console.log("Updated wallet:", updatedWallet);

          // ✅ Stop polling when payment is received
          if (updatedWallet?.coins > 0) {
            setWaiting(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Wallet refresh error:", err);
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval); // cleanup
    };
  }, [account, waiting]);

  // ===============================
  // Copy Account Number
  // ===============================
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
          Deposit (Bank Transfer)
        </h2>

        {/* ===============================
            AMOUNT SELECTION
        =============================== */}
        {!account && (
          <>
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

            <input
              type="number"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-5"
            />

            <button
              onClick={handleDeposit}
              disabled={loading}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400"
            >
              {loading ? "Generating account..." : "Generate Account"}
            </button>
          </>
        )}

        {/* ===============================
            ACCOUNT DETAILS
        =============================== */}
        {account && (
          <div className="mt-6 p-5 rounded-xl bg-white/40 backdrop-blur-sm border border-white/40">

            <p className="text-sm text-gray-600 mb-3">
              Transfer the exact amount below to complete your deposit
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

            {/* ===============================
                WAITING STATE
            =============================== */}
            {waiting && (
              <p className="mt-4 text-xs text-orange-600 text-center animate-pulse">
                ⏳ Waiting for payment confirmation...
              </p>
            )}

            {/* ===============================
                SUCCESS STATE
            =============================== */}
            {!waiting && wallet && (
              <p className="mt-4 text-sm text-green-600 text-center font-semibold">
                ✅ Payment received! Wallet updated.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 text-center">
          Minimum deposit ₦100
        </p>
      </div>
    </div>
  );
}