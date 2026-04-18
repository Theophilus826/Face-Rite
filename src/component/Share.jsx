import React, { useState, useEffect } from "react";

function Share({ user, token }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [target, setTarget] = useState(5);
  const [reward, setReward] = useState(10);
  const [loading, setLoading] = useState(false);

  const referralCode = user?.referralCode || "";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  /* ---------------- COPY LINK ---------------- */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);

      setCopied(true);
      setMessage("Referral link copied!");

      setTimeout(() => {
        setCopied(false);
        setMessage("");
      }, 2000);
    } catch {
      setMessage("Failed to copy link.");
    }
  };

  /* ---------------- FETCH REFERRAL STATS ---------------- */
  const fetchReferralStats = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const res = await fetch("/api/auth/referral-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setProgress(data.referrals || 0);
        setTarget(data.required || 5);
        setReward(data.reward || 10);
      }
    } catch (err) {
      console.error("Referral fetch error:", err);
      setMessage("Failed to load referral stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, [token]);

  /* ---------------- PROGRESS CALC ---------------- */
  const percent = Math.min((progress / target) * 100, 100);

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxWidth: "400px",
      }}
    >
      <h2>Invite Friends & Earn Coins</h2>

      {loading && <p>Loading stats...</p>}

      <p>
        Your referral code: <strong>{referralCode}</strong>
      </p>

      {/* Progress Bar */}
      <div
        style={{
          margin: "10px 0",
          background: "#eee",
          borderRadius: "8px",
          height: "20px",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            background: "#4ade80",
            height: "100%",
            borderRadius: "8px",
            transition: "width 0.3s",
          }}
        />
      </div>

      <p>
        {progress}/{target} referrals
      </p>

      <p>
        Invite {target} friends and earn <strong>{reward} coins</strong>
      </p>

      <button onClick={handleCopy}>
        {copied ? "Copied!" : "Copy Referral Link"}
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}

export default Share;