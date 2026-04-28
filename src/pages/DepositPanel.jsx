import { useState, useEffect } from "react";
import { generateDepositAccount } from "../features/Api";

const amounts = [2000, 3000, 5000, 10000, 20000, 50000, 100000, 200000];

export default function DepositPanel() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("opay");

  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);

  const [status, setStatus] = useState("idle"); 
  // idle | waiting | success | expired

  const [timeLeft, setTimeLeft] = useState(180);
  const [file, setFile] = useState(null);

  // ===============================
  // HANDLE DEPOSIT
  // ===============================
  const handleDeposit = async () => {
    if (!amount || amount < 500) {
      alert("Minimum deposit is ₦500");
      return;
    }

    try {
      setLoading(true);

      const data = await generateDepositAccount({ amount, method });

      setAccount(data);
      setStatus("waiting");
      setTimeLeft(180);
    } catch (err) {
      alert(err.message || "Failed to generate account");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // TIMER
  // ===============================
  useEffect(() => {
    if (status !== "waiting") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ===============================
  // UPLOAD RECEIPT
  // ===============================
  const uploadReceipt = async () => {
    if (!file) return alert("Select receipt");

    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("depositId", account._id);

    try {
      const res = await fetch("/api/wallet/upload-receipt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      setStatus("success"); // ✅ ONLY here success happens
    } catch {
      alert("Upload failed");
    }
  };

  // ===============================
  // COPY ACCOUNT
  // ===============================
  const copyAccount = () => {
    navigator.clipboard.writeText(account?.accountNumber);
    alert("Copied!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border shadow-lg">

        <h2 className="text-2xl font-bold text-center mb-4">
          Deposit
        </h2>

        {/* METHOD */}
        {!account && (
          <div className="mb-4">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full p-3 rounded-lg border"
            >
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

        {/* ACCOUNT */}
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

            <button onClick={copyAccount} className="text-blue-500 mt-2">
              Copy Account
            </button>

            {/* WAITING */}
            {status === "waiting" && (
              <>
                <p className="text-orange-500 mt-3 animate-pulse">
                  Make payment and upload receipt
                </p>

                <input
                  type="file"
                  className="mt-3"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <button
                  onClick={uploadReceipt}
                  className="w-full mt-2 bg-green-500 text-white py-2 rounded"
                >
                  Submit Receipt
                </button>
              </>
            )}

            {/* EXPIRED */}
            {status === "expired" && (
              <>
                <p className="text-red-500 mt-3">
                  Time expired. Upload receipt anyway.
                </p>

                <input
                  type="file"
                  className="mt-3"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <button
                  onClick={uploadReceipt}
                  className="w-full mt-2 bg-green-500 text-white py-2 rounded"
                >
                  Submit Receipt
                </button>
              </>
            )}

            {/* SUCCESS */}
            {status === "success" && (
              <p className="text-green-600 mt-3">
                Payment received 🎉
              </p>
            )}

          </div>
        )}

        <p className="text-xs text-center mt-4">
          Minimum deposit ₦500
        </p>
      </div>
    </div>
  );
}