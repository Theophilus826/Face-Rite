import { useEffect, useRef, useState } from "react";
import API from "../features/Api";

export default function AdminDeposit() {
  // ============================================================
  // DEPOSITS
  // ============================================================
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  // ============================================================
  // PAYMENT SETTINGS
  // ============================================================
  const [paymentSettings, setPaymentSettings] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    paymentLink: "",
  });

  const [paymentLoading, setPaymentLoading] = useState(true);
  const [savingPayment, setSavingPayment] = useState(false);

  const prevIdsRef = useRef([]);
  const highlightTimerRef = useRef(null);

  // ============================================================
  // FETCH PAYMENT SETTINGS
  // ============================================================
  const fetchPaymentSettings = async () => {
    try {
      setPaymentLoading(true);

      const res = await API.get("/admin/payment-settings");

      const data = res.data?.data || res.data;

      setPaymentSettings({
        bankName: data?.bankName || "",
        accountName: data?.accountName || "",
        accountNumber: data?.accountNumber || "",
        paymentLink: data?.paymentLink || "",
      });
    } catch (err) {
      console.error(
        "❌ Fetch payment settings error:",
        err,
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // ============================================================
  // HANDLE PAYMENT SETTINGS INPUT
  // ============================================================
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;

    setPaymentSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // SAVE PAYMENT SETTINGS
  // ============================================================
  const savePaymentSettings = async (e) => {
    e.preventDefault();

    const bankName = paymentSettings.bankName.trim();
    const accountName =
      paymentSettings.accountName.trim();
    const accountNumber =
      paymentSettings.accountNumber.trim();
    const paymentLink =
      paymentSettings.paymentLink.trim();

    const hasAccountNumber = Boolean(accountNumber);
    const hasPaymentLink = Boolean(paymentLink);

    if (!hasAccountNumber && !hasPaymentLink) {
      alert("Enter an account number or payment link.");
      return;
    }

    if (hasAccountNumber && (!bankName || !accountName)) {
      alert("Bank name and account name are required when using an account number.");
      return;
    }

    setSavingPayment(true);

    try {
      const res = await API.put(
        "/admin/payment-settings",
        {
          bankName,
          accountName,
          accountNumber,
          paymentLink,
        },
      );

      const saved =
        res.data?.data || res.data;

      setPaymentSettings({
        bankName: saved?.bankName || bankName,
        accountName:
          saved?.accountName || accountName,
        accountNumber:
          saved?.accountNumber ||
          accountNumber,
        paymentLink:
          saved?.paymentLink || paymentLink,
      });

      alert(
        "✅ Payment account saved successfully.",
      );
    } catch (err) {
      console.error(
        "❌ Save payment settings error:",
        err,
      );

      alert(
        err.response?.data?.message ||
          "Failed to save payment settings.",
      );
    } finally {
      setSavingPayment(false);
    }
  };

  // ============================================================
  // FETCH PENDING DEPOSITS
  // ============================================================
  const fetchDeposits = async () => {
    try {
      const res = await API.get(
        "/admin/deposits/pending",
      );

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const currentIds = data.map(
        (d) => d._id,
      );

      const newIdsDetected =
        currentIds.filter(
          (id) =>
            !prevIdsRef.current.includes(id),
        );

      if (newIdsDetected.length > 0) {
        setNewIds(newIdsDetected);

        if (highlightTimerRef.current) {
          clearTimeout(
            highlightTimerRef.current,
          );
        }

        highlightTimerRef.current =
          setTimeout(() => {
            setNewIds([]);
          }, 3000);
      }

      prevIdsRef.current = currentIds;

      setDeposits(data);
    } catch (err) {
      console.error(
        "❌ Fetch deposits error:",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================
  useEffect(() => {
    fetchPaymentSettings();
    fetchDeposits();

    const interval = setInterval(
      fetchDeposits,
      5000,
    );

    return () => {
      clearInterval(interval);

      if (highlightTimerRef.current) {
        clearTimeout(
          highlightTimerRef.current,
        );
      }
    };
  }, []);

  // ============================================================
  // APPROVE DEPOSIT
  // ============================================================
  const approve = async (id) => {
    const deposit = deposits.find(
      (d) => d._id === id,
    );

    if (!deposit) return;

    const amount = Number(
      deposit.expectedAmount || 0,
    );

    const confirmed = window.confirm(
      `Approve this deposit of ₦${amount.toLocaleString()}?\n\n` +
        `User: ${
          deposit.user?.name ||
          "Unknown User"
        }\n` +
        `Reference: ${
          deposit.reference || "N/A"
        }\n\n` +
        `The user's wallet will be credited.`,
    );

    if (!confirmed) return;

    setActionLoading(id);

    try {
      const res = await API.put(
        `/admin/deposits/approve/${id}`,
      );

      const result = res.data;

      console.log(
        "✅ Deposit approved:",
        result,
      );

      // Remove from pending list because
      // it is no longer pending.
      setDeposits((prev) =>
        prev.filter((d) => d._id !== id),
      );

      setNewIds((prev) =>
        prev.filter(
          (newId) => newId !== id,
        ),
      );

      alert(
        result?.message ||
          "Deposit approved successfully.",
      );
    } catch (err) {
      console.error(
        "❌ Approve failed:",
        err,
      );

      alert(
        err.response?.data?.message ||
          "Approve failed. The user's balance was not changed.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // REJECT DEPOSIT
  // ============================================================
  const reject = async (id) => {
    const deposit = deposits.find(
      (d) => d._id === id,
    );

    if (!deposit) return;

    const reason = window.prompt(
      "Enter the reason for rejecting this deposit:",
    );

    if (!reason || !reason.trim()) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to reject this deposit?",
    );

    if (!confirmed) return;

    setActionLoading(id);

    try {
      const res = await API.put(
        `/admin/deposits/reject/${id}`,
        {
          reason: reason.trim(),
        },
      );

      const result = res.data;

      console.log(
        "✅ Deposit rejected:",
        result,
      );

      // Remove from pending list.
      setDeposits((prev) =>
        prev.filter((d) => d._id !== id),
      );

      setNewIds((prev) =>
        prev.filter(
          (newId) => newId !== id,
        ),
      );

      alert(
        result?.message ||
          "Deposit rejected successfully.",
      );
    } catch (err) {
      console.error(
        "❌ Reject failed:",
        err,
      );

      alert(
        err.response?.data?.message ||
          "Reject failed.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // VIEW RECEIPT
  // ============================================================
  const viewReceipt = (deposit) => {
    const receipt =
      deposit.receipt ||
      deposit.paymentData?.receiptUrl;

    if (!receipt) {
      alert("No receipt available.");
      return;
    }

    window.open(
      receipt,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">
            Loading dashboard...
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Please wait.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* ========================================================
          HEADER
      ======================================================== */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              🔴 Live Admin Dashboard
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Manage payment settings and
              customer deposits.
            </p>
          </div>

          <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-semibold">
            ● Live
          </div>
        </div>
      </div>

      {/* ========================================================
          PAYMENT SETTINGS
      ======================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border p-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold">
              💳 Payment Account
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              New deposits will automatically
              use these details.
            </p>
          </div>

          <span className="self-start text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-full font-semibold">
            ADMIN CONTROLLED
          </span>
        </div>

        {paymentLoading ? (
          <div className="py-6 text-center text-gray-500">
            Loading payment settings...
          </div>
        ) : (
          <form
            onSubmit={savePaymentSettings}
            className="space-y-5"
          >
            {/* BANK NAME */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bank Name
              </label>

              <input
                type="text"
                name="bankName"
                value={
                  paymentSettings.bankName
                }
                onChange={
                  handlePaymentChange
                }
                placeholder="e.g. OPay"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* ACCOUNT NAME */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Name
              </label>

              <input
                type="text"
                name="accountName"
                value={
                  paymentSettings.accountName
                }
                onChange={
                  handlePaymentChange
                }
                placeholder="e.g. Theophilus Telecom"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* ACCOUNT NUMBER */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Number
              </label>

              <input
                type="text"
                name="accountNumber"
                value={
                  paymentSettings.accountNumber
                }
                onChange={
                  handlePaymentChange
                }
                placeholder="Enter account number"
                inputMode="numeric"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* PAYMENT LINK */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Link{" "}
                <span className="font-normal text-gray-400">
                  (Optional)
                </span>
              </label>

              <input
                type="url"
                name="paymentLink"
                value={
                  paymentSettings.paymentLink
                }
                onChange={
                  handlePaymentChange
                }
                placeholder="https://..."
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* PREVIEW */}
            <div className="border rounded-xl bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Current Account
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Bank
                  </p>

                  <p className="font-semibold break-words">
                    {paymentSettings.bankName ||
                      "Not configured"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Account Name
                  </p>

                  <p className="font-semibold break-words">
                    {paymentSettings.accountName ||
                      "Not configured"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Account Number
                  </p>

                  <p className="font-semibold break-words">
                    {paymentSettings.accountNumber ||
                      "Not configured"}
                  </p>
                </div>
              </div>

              {paymentSettings.paymentLink && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500">
                    Payment Link
                  </p>

                  <a
                    href={
                      paymentSettings.paymentLink
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline break-all text-sm"
                  >
                    {
                      paymentSettings.paymentLink
                    }
                  </a>
                </div>
              )}
            </div>

            {/* SAVE */}
            <button
              type="submit"
              disabled={savingPayment}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {savingPayment
                ? "Saving..."
                : "💾 Save Payment Account"}
            </button>
          </form>
        )}
      </div>

      {/* ========================================================
          PENDING DEPOSITS HEADER
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold">
            💰 Pending Deposits
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Deposits refresh automatically every
            5 seconds.
          </p>
        </div>

        <span className="self-start bg-orange-100 text-orange-700 px-3 py-2 rounded-full text-sm font-semibold">
          {deposits.length} Pending
        </span>
      </div>

      {/* ========================================================
          EMPTY STATE
      ======================================================== */}
      {deposits.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">
            💰
          </div>

          <h3 className="font-semibold text-lg">
            No pending deposits
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            New customer deposits will appear
            here automatically.
          </p>
        </div>
      ) : (
        /* ======================================================
           DEPOSITS
        ====================================================== */
        <div className="space-y-4">
          {deposits.map((d) => {
            const isNew = newIds.includes(
              d._id,
            );

            const isProcessing =
              actionLoading === d._id;

            const receipt =
              d.receipt ||
              d.paymentData?.receiptUrl;

            return (
              <div
                key={d._id}
                className={`p-4 rounded-2xl border shadow-sm transition-all duration-300 ${
                  isNew
                    ? "bg-green-100 border-green-400"
                    : "bg-white"
                }`}
              >
                {/* USER */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {d.user?.name ||
                        "Unknown User"}
                    </p>

                    <p className="text-sm text-gray-500">
                      {d.user?.email ||
                        "No email"}
                    </p>
                  </div>

                  <span
                    className={`self-start text-xs px-3 py-1.5 rounded-full font-semibold ${
                      d.status ===
                      "COMPLETED"
                        ? "bg-green-200 text-green-700"
                        : d.status ===
                            "FAILED"
                          ? "bg-red-200 text-red-700"
                          : "bg-orange-200 text-orange-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                {/* DETAILS */}
                <div className="mt-4 text-sm bg-gray-50 rounded-xl p-4 space-y-2">
                  <p>
                    <b>Amount:</b> ₦
                    {Number(
                      d.expectedAmount || 0,
                    ).toLocaleString()}
                  </p>

                  <p>
                    <b>Bank:</b>{" "}
                    {d.bankName || "N/A"}
                  </p>

                  <p>
                    <b>Account Name:</b>{" "}
                    {d.accountName || "N/A"}
                  </p>

                  <p>
                    <b>Account Number:</b>{" "}
                    {d.accountNumber || "N/A"}
                  </p>

                  <p>
                    <b>Method:</b>{" "}
                    {d.method || "N/A"}
                  </p>

                  {d.paymentLink && (
                    <p className="break-all">
                      <b>Payment Link:</b>{" "}
                      <a
                        href={d.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        {d.paymentLink}
                      </a>
                    </p>
                  )}

                  {d.reference && (
                    <p className="break-all">
                      <b>Reference:</b>{" "}
                      {d.reference}
                    </p>
                  )}
                </div>

                {/* REVIEW STATUS */}
                {d.reviewStatus && (
                  <div className="mt-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                      Review:{" "}
                      {d.reviewStatus}
                    </span>
                  </div>
                )}

                {/* RECEIPT */}
                {receipt && (
                  <button
                    type="button"
                    onClick={() =>
                      viewReceipt(d)
                    }
                    disabled={isProcessing}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    👁 View Receipt
                  </button>
                )}

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() =>
                      approve(d._id)
                    }
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isProcessing
                      ? "Processing..."
                      : "✓ Approve"}
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() =>
                      reject(d._id)
                    }
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isProcessing
                      ? "Processing..."
                      : "✕ Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}