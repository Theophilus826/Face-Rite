import { useState, useEffect } from "react";
import { generateDepositAccount, getWalletBalance } from "../features/Api";

const amounts = [2000, 3000, 5000, 10000, 20000, 50000, 100000, 200000];

export default function DepositPanel() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("ngn");

  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [wallet, setWallet] = useState(null);

  // ⏱ TIMER STATES
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [expired, setExpired] = useState(false);

  // ===============================
  // HANDLE DEPOSIT
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
        body: JSON.stringify({ amount, method }),
      });

      const text = await res.text();

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        throw new Error("Server returned invalid response");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to generate account");
      }

      setAccount(data);
      setWaiting(true);
      setTimeLeft(900);
      setExpired(false);

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // TIMER LOGIC
  // ===============================
  useEffect(() => {
    let timer;

    if (waiting && account && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0) {
      setExpired(true);
      setWaiting(false);
    }

    return () => clearInterval(timer);
  }, [waiting, account, timeLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ===============================
  // WALLET POLLING
  // ===============================
  useEffect(() => {
    let interval;

    if (waiting && account) {
      interval = setInterval(async () => {
        try {
          const res = await getWalletBalance();
          setWallet(res);

          // ⚠️ FIXED LOGIC (was wrong before)
          if (res?.balance > (wallet?.balance || 0)) {
            setWaiting(false);
          }
        } catch (err) {
          console.error(err);
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [waiting, account, wallet]);

  // ===============================
  // COPY ACCOUNT
  // ===============================
  const copyAccount = () => {
    navigator.clipboard.writeText(account?.accountNumber);
    alert("Copied!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border border-white/30 shadow-lg">

        <h2 className="text-2xl font-bold text-center mb-4">
          Deposit
        </h2>

        {/* ===============================
            METHOD SELECTOR
        =============================== */}
        {!account && (
          <div className="mb-4">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full p-3 rounded-lg border"
            >
              <option value="ngn">Bank Transfer (Monnify)</option>
              <option value="opay">OPay</option>
              <option value="palmpay">PalmPay</option>
            </select>
          </div>
        )}

        {/* AMOUNT */}
        {!account && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`p-3 rounded-lg ${
                    amount === amt ? "bg-blue-500 text-white" : "bg-white"
                  }`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-3 border rounded mb-3"
            />

            <button
              onClick={handleDeposit}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded"
            >
              {loading ? "Generating..." : "Generate Account"}
            </button>
          </>
        )}

        {/* ===============================
            ACCOUNT DETAILS
        =============================== */}
        {account && (
          <div className="mt-5">

            <p className="text-center text-red-500 font-bold">
              ⏱ Time Left: {formatTime(timeLeft)}
            </p>

            <p><b>Bank:</b> {account.bankName}</p>
            <p><b>Name:</b> {account.accountName}</p>

            <h2 className="text-xl font-bold mt-2">
              {account.accountNumber}
            </h2>

            <button
              onClick={copyAccount}
              className="text-blue-500 mt-2"
            >
              Copy Account
            </button>

            {/* WAITING */}
            {waiting && !expired && (
              <p className="text-orange-500 mt-3 animate-pulse">
                Waiting for payment...
              </p>
            )}

            {/* SUCCESS */}
            {!waiting && wallet && (
              <p className="text-green-600 mt-3">
                Payment received 🎉
              </p>
            )}

            {/* EXPIRED → RECEIPT */}
            {expired && (
              <div className="mt-4">
                <p className="text-red-500 font-semibold">
                  Time expired. Upload receipt.
                </p>

                <input type="file" className="mt-2" />

                <button className="w-full mt-2 bg-green-500 text-white py-2 rounded">
                  Submit Receipt
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-center mt-4">
          Minimum deposit ₦100
        </p>
      </div>
    </div>
  );
}