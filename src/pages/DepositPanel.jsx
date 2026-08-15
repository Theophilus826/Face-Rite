import { useState, useEffect } from "react";
import API, { generateDepositAccount } from "../features/Api";

const amounts = [2000, 3000, 5000, 10000, 20000, 50000, 100000, 200000];

export default function DepositPanel() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("opay");
  const [customDetails, setCustomDetails] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    paymentLink: "",
  });
  const [paymentConfig, setPaymentConfig] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    paymentLink: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [account, setAccount] = useState(null);

  const [status, setStatus] = useState("idle");
  // idle | waiting | success | expired

  const [timeLeft, setTimeLeft] = useState(180);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const res = await API.get("/admin/payment-settings");
        const data = res.data?.data || res.data || {};

        const nextConfig = {
          bankName: data.bankName || "",
          accountName: data.accountName || "",
          accountNumber: data.accountNumber || "",
          paymentLink: data.paymentLink || "",
        };

        setPaymentConfig(nextConfig);

        if (nextConfig.paymentLink && !nextConfig.accountNumber) {
          setMethod("link");
        } else if (nextConfig.accountNumber) {
          setMethod("bank");
        }
      } catch (err) {
        console.error("❌ Fetch payment settings error:", err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchPaymentSettings();
  }, []);

  // ===============================
  // HANDLE DEPOSIT
  // ===============================
  const handleDeposit = async () => {
    if (!amount || amount < 500) {
      alert("Minimum deposit is ₦500");
      return;
    }

    const activeMethod =
      paymentConfig.paymentLink && !paymentConfig.accountNumber
        ? "link"
        : paymentConfig.accountNumber
          ? "bank"
          : method;

    const activeDetails = {
      bankName:
        paymentConfig.bankName || customDetails.bankName,
      accountName:
        paymentConfig.accountName || customDetails.accountName,
      accountNumber:
        paymentConfig.accountNumber || customDetails.accountNumber,
      paymentLink:
        paymentConfig.paymentLink || customDetails.paymentLink,
    };

    if (["bank", "custom", "manual"].includes(activeMethod) && !activeDetails.accountNumber && !activeDetails.paymentLink) {
      alert("Enter an account number or payment link");
      return;
    }

    if (activeMethod === "link" && !activeDetails.paymentLink) {
      alert("Enter a valid payment link");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount,
        method: activeMethod,
        bankName: activeDetails.bankName,
        accountName: activeDetails.accountName,
        accountNumber: activeDetails.accountNumber,
        paymentLink: activeDetails.paymentLink,
      };

      const data = await generateDepositAccount(payload);

      setAccount(data.deposit || data);
      setStatus("waiting");
      setTimeLeft(180);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to generate account");
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
      await API.put("/wallet/upload-receipt", formData);

      setStatus("success");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  // ===============================
  // COPY ACCOUNT
  // ===============================
  const copyAccount = () => {
    const value = account?.accountNumber || account?.paymentLink || "";
    if (!value) return;

    navigator.clipboard.writeText(value);
    alert(account?.accountNumber ? "Account copied!" : "Payment link copied!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/30 backdrop-blur-md border shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">Deposit</h2>

        {/* METHOD */}
        {!account && !loadingSettings && (
          <div className="mb-4 space-y-3">
            {paymentConfig.accountNumber || paymentConfig.paymentLink ? (
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-sm font-semibold text-gray-700">Configured payment method</p>

                {paymentConfig.paymentLink && (
                  <a
                    href={paymentConfig.paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-sm text-blue-600 underline break-all"
                  >
                    {paymentConfig.paymentLink}
                  </a>
                )}

                {paymentConfig.accountNumber && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p>
                      <b>Bank:</b> {paymentConfig.bankName || "N/A"}
                    </p>
                    <p>
                      <b>Name:</b> {paymentConfig.accountName || "N/A"}
                    </p>
                    <p>
                      <b>Account:</b> {paymentConfig.accountNumber}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full p-3 rounded-lg border"
                >
                  <option value="opay">OPay</option>
                  <option value="palmpay">PalmPay</option>
                  <option value="bank">Bank Account</option>
                  <option value="link">Payment Link</option>
                </select>

                {method === "bank" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Bank name"
                      value={customDetails.bankName}
                      onChange={(e) =>
                        setCustomDetails((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                      className="w-full p-3 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Account name"
                      value={customDetails.accountName}
                      onChange={(e) =>
                        setCustomDetails((prev) => ({
                          ...prev,
                          accountName: e.target.value,
                        }))
                      }
                      className="w-full p-3 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Account number"
                      value={customDetails.accountNumber}
                      onChange={(e) =>
                        setCustomDetails((prev) => ({
                          ...prev,
                          accountNumber: e.target.value,
                        }))
                      }
                      className="w-full p-3 border rounded"
                    />
                  </div>
                )}

                {(method === "link" || method === "custom") && (
                  <input
                    type="url"
                    placeholder="Payment link"
                    value={customDetails.paymentLink}
                    onChange={(e) =>
                      setCustomDetails((prev) => ({
                        ...prev,
                        paymentLink: e.target.value,
                      }))
                    }
                    className="w-full p-3 border rounded"
                  />
                )}
              </>
            )}
          </div>
        )}

        {loadingSettings && !account && (
          <div className="mb-4 text-center text-sm text-gray-500">
            Loading payment details...
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

            {account.paymentLink ? (
              <>
                <p>
                  <b>Method:</b> {account.bankName || "Payment Link"}
                </p>
                <a
                  href={account.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 text-blue-600 underline break-all"
                >
                  {account.paymentLink}
                </a>
                <button onClick={copyAccount} className="text-blue-500 mt-2 block">
                  Copy Payment Link
                </button>
              </>
            ) : (
              <>
                <p>
                  <b>Bank:</b> {account.bankName}
                </p>
                <p>
                  <b>Name:</b> {account.accountName}
                </p>

                <h2 className="text-xl font-bold mt-2">{account.accountNumber}</h2>

                <button onClick={copyAccount} className="text-blue-500 mt-2">
                  Copy Account
                </button>
              </>
            )}

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
              <p className="text-green-600 mt-3">Payment received 🎉</p>
            )}
          </div>
        )}

        <p className="text-xs text-center mt-4">Minimum deposit ₦500</p>
      </div>
    </div>
  );
}
