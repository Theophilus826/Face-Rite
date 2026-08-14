import React, { useState, useEffect } from "react";
import "../Share.css";
import API from "../features/Api";
import { Link } from "react-router-dom";

const MILESTONES = [
  { users: 5, reward: 1000 },
  { users: 13, reward: 2500 },
  { users: 25, reward: 3600 },
];

function Share({ user }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  const [referralCode, setReferralCode] = useState(
    user?.referralCode || user?.referral_code || ""
  );

  const [stats, setStats] = useState({
    cash: 0,
    referrals: 0,
    reward: MILESTONES[0].reward,
    required: MILESTONES[0].users,
    invitees: [],
    milestones: MILESTONES,
  });

  // ================================
  // REFERRAL LINK
  // ================================

  const referralLink = referralCode
    ? `${window.location.origin}/register?ref=${encodeURIComponent(
        referralCode
      )}`
    : "";

  // ================================
  // UPDATE REFERRAL CODE FROM USER
  // ================================

  useEffect(() => {
    const code =
      user?.referralCode ||
      user?.referral_code ||
      "";

    if (code) {
      setReferralCode(code);
    }
  }, [user]);

  // ================================
  // LOAD REFERRAL STATS
  // ================================

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);

      const { data } = await API.get("/share/referral-stats");

      console.log("Referral stats:", data);

      if (data.success) {
        // Support different possible backend response formats
        const code =
          data.referralCode ||
          data.referral_code ||
          data.user?.referralCode ||
          data.user?.referral_code ||
          data.data?.referralCode ||
          data.data?.referral_code ||
          "";

        if (code) {
          setReferralCode(code);
        }

        setStats((prev) => ({
          ...prev,
          ...data,
          milestones: MILESTONES,
        }));
      }
    } catch (error) {
      console.error("Referral stats error:", error);

      setMessage("Unable to load referral stats.");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // INVITE
  // ================================

  const handleInvite = async () => {
    if (!referralCode) {
      setMessage(
        "Referral code not available. Please refresh the page."
      );
      return;
    }

    const text = `Join using my referral link and earn rewards!\n\nReferral Code: ${referralCode}\n\n${referralLink}`;

    try {
      // Mobile/browser share
      if (navigator.share) {
        await navigator.share({
          title: "Invite Friends",
          text,
        });

        return;
      }

      // Clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);

        setCopied(true);
        setMessage("Referral link and code copied!");

        setTimeout(() => {
          setCopied(false);
          setMessage("");
        }, 2500);

        return;
      }

      // Fallback clipboard method
      const textarea = document.createElement("textarea");

      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      document.execCommand("copy");

      document.body.removeChild(textarea);

      setCopied(true);
      setMessage("Referral link and code copied!");

      setTimeout(() => {
        setCopied(false);
        setMessage("");
      }, 2500);
    } catch (error) {
      console.error("Invite error:", error);

      // Don't show error when user simply closes the share dialog
      if (error.name !== "AbortError") {
        setMessage("Unable to share referral link.");
      }
    }
  };

  // ================================
  // WITHDRAW
  // ================================

  const handleWithdraw = async () => {
    try {
      setLoading(true);

      const { data } = await API.post("/share/withdraw");

      setMessage(data.message || "Withdrawal successful.");

      await fetchReferralStats();
    } catch (error) {
      console.error("Withdrawal error:", error);

      setMessage(
        error.response?.data?.message ||
          "Withdrawal failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // PROGRESS
  // ================================

  const maxUsers =
    stats.milestones?.[stats.milestones.length - 1]?.users ||
    MILESTONES[MILESTONES.length - 1].users;

  const percent = Math.min(
    (stats.referrals / maxUsers) * 100,
    100
  );

  // Find next milestone
  const nextMilestone =
    stats.milestones?.find(
      (milestone) =>
        stats.referrals < milestone.users
    ) ||
    stats.milestones?.[
      stats.milestones.length - 1
    ] ||
    MILESTONES[MILESTONES.length - 1];

  const remainingUsers = Math.max(
    nextMilestone.users - stats.referrals,
    0
  );

  // ================================
  // UI
  // ================================

  return (
    <div className="share-page">

      {/* ================= HEADER ================= */}

      <div className="share-header">
        <h1>Invite Friends</h1>

        <h2>Get Rewards</h2>

        <Link to="/ShareTasks">
          <button className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-xl transition-colors duration-200">
            ShareTasks
          </button>
        </Link>
      </div>

      {/* ================= CASH CARD ================= */}

      <div className="cash-card">

        <div className="cash-row">

          <div>
            <h3>My Cash</h3>

            <h1>
              ₦{Number(stats.cash || 0).toLocaleString()}
            </h1>
          </div>

          <button
            className="withdraw-btn"
            onClick={handleWithdraw}
            disabled={
              loading ||
              Number(stats.cash || 0) <= 0
            }
          >
            Withdraw
          </button>

        </div>

        {/* ================= REWARD MESSAGE ================= */}

        <p>
          {remainingUsers > 0 ? (
            <>
              Invite{" "}
              <strong>{remainingUsers}</strong>{" "}
              more{" "}
              {remainingUsers === 1
                ? "user"
                : "users"}{" "}
              to earn{" "}
              <strong>
                ₦
                {Number(
                  nextMilestone.reward
                ).toLocaleString()}
              </strong>
            </>
          ) : (
            <>
              🎉 Congratulations! You've
              reached the highest reward of{" "}
              <strong>
                ₦
                {Number(
                  nextMilestone.reward
                ).toLocaleString()}
              </strong>
            </>
          )}
        </p>

        {/* ================= PROGRESS ================= */}

        <div className="progress-container">

          <div className="progress-line">

            <div
              className="progress-fill"
              style={{
                width: `${percent}%`,
              }}
            />

            {stats.milestones.map((item) => (
              <div
                key={item.users}
                className={`milestone ${
                  stats.referrals >= item.users
                    ? "active"
                    : ""
                }`}
                style={{
                  left: `${
                    (item.users / maxUsers) * 100
                  }%`,
                }}
              >
                <span>
                  ₦
                  {Number(
                    item.reward
                  ).toLocaleString()}
                </span>

                <small>
                  {item.users} Users
                </small>
              </div>
            ))}

          </div>

        </div>

        {/* ================= STEPS ================= */}

        <div className="steps">

          <div>
            <span>🔗</span>
            <p>Share Link</p>
          </div>

          <div>
            <span>⭐</span>
            <p>Invitee Finishes</p>
          </div>

          <div>
            <span>💰</span>
            <p>Get Cash</p>
          </div>

        </div>

        {/* ================= REFERRAL CODE ================= */}

        {referralCode ? (
          <div className="referral-code-box">

            <p>Your Referral Code</p>

            <strong>
              {referralCode}
            </strong>

          </div>
        ) : (
          <div className="referral-code-box">

            <p>Referral Code</p>

            <strong>
              Loading...
            </strong>

          </div>
        )}

        {/* ================= INVITE BUTTON ================= */}

        <button
          className="invite-btn"
          onClick={handleInvite}
          disabled={
            loading || !referralCode
          }
        >
          {copied ? (
            <>
              <span>Copied!</span>

              <small>
                Referral code and link copied
              </small>
            </>
          ) : (
            <>
              <span>Invite Now</span>

              <small>
                Referral Code:{" "}
                {referralCode || "Loading..."}
              </small>
            </>
          )}
        </button>

        {/* ================= MESSAGE ================= */}

        {message && (
          <p className="message">
            {message}
          </p>
        )}

      </div>

      {/* ================= INVITEES ================= */}

      <div className="invitees-card">

        <h2>My Invitees</h2>

        {loading ? (
          <p>Loading...</p>
        ) : stats.invitees?.length ? (

          stats.invitees.map((invite) => (

            <div
              className="invitee"
              key={invite._id}
            >

              <div>

                <strong>
                  {invite.referredUser?.name ||
                    "Unknown User"}
                </strong>

                <p>
                  {invite.referredUser?.email ||
                    invite.referredUser?.phone ||
                    "No contact information"}
                </p>

              </div>

              <span
                className={`status ${
                  invite.rewarded
                    ? "done"
                    : invite.completed
                    ? "completed"
                    : "pending"
                }`}
              >
                {invite.rewarded
                  ? "Rewarded"
                  : invite.completed
                  ? "Completed"
                  : "Pending Task"}
              </span>

            </div>

          ))

        ) : (

          <div className="empty">

            <h3>No Invitees Yet</h3>

            <p>
              Invite friends using your
              referral link.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}

export default Share;