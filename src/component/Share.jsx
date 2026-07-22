import React, { useState, useEffect } from "react";
import "../Share.css";
import API from "../features/Api";

function Share({ user }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  const [stats, setStats] = useState({
    cash: 0,
    referrals: 0,
    reward: 10,
    required: 5,
    invitees: [],
    milestones: [
      { users: 5, reward: 1000 },
      { users: 13, reward: 2500 },
      { users: 25, reward: 3600 },
    ],
  });

  const referralCode = user?.referralCode || "";

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    fetchReferralStats();
  }, []);

  /* ================= LOAD STATS ================= */

  const fetchReferralStats = async () => {
    try {
      setLoading(true);

      const { data } = await API.get("/share/referral-stats");

      if (data.success) {
        setStats((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (err) {
      console.error(err);
      setMessage("Unable to load referral stats");
    } finally {
      setLoading(false);
    }
  };

  /* ================= INVITE ================= */

  const handleInvite = async () => {
    if (!referralCode) {
      setMessage("Referral code not available.");
      return;
    }

    const text = `Join using my referral link and earn rewards!\n${referralLink}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Invite Friends",
          text,
          url: referralLink,
        });
      } else {
        await navigator.clipboard.writeText(referralLink);

        setCopied(true);
        setMessage("Referral link copied!");

        setTimeout(() => {
          setCopied(false);
          setMessage("");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= WITHDRAW ================= */

  const handleWithdraw = async () => {
    try {
      setLoading(true);

      const { data } = await API.post("/share/withdraw");

      setMessage(data.message);

      fetchReferralStats();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Withdrawal failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= PROGRESS ================= */

  const maxUsers =
    stats.milestones[stats.milestones.length - 1]?.users ||
    stats.required;

  const percent = Math.min(
    (stats.referrals / maxUsers) * 100,
    100
  );

  return (
    <div className="share-page">
      <div className="share-header">
        <h1>Invite Friends</h1>
        <h2>Get Rewards</h2>
      </div>

      <div className="cash-card">
        <div className="cash-row">
          <div>
            <h3>My Cash</h3>
            <h1>₦{stats.cash}</h1>
          </div>

          <button
            className="withdraw-btn"
            onClick={handleWithdraw}
            disabled={loading || stats.cash <= 0}
          >
            Withdraw
          </button>
        </div>

        <p>
          Invite{" "}
          <strong>
            {Math.max(stats.required - stats.referrals, 0)}
          </strong>{" "}
          more users to reach ₦{stats.reward}
        </p>

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
                  left: `${(item.users / maxUsers) * 100}%`,
                }}
              >
                <span>₦{item.reward}</span>
                <small>{item.users} Users</small>
              </div>
            ))}
          </div>
        </div>

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

        <button
          className="invite-btn"
          onClick={handleInvite}
          disabled={loading}
        >
          {copied ? "Copied!" : "Invite Now"}
        </button>

        {message && (
          <p className="message">{message}</p>
        )}
      </div>

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
                  {invite.referredUser?.name}
                </strong>

                <p>
                  {invite.referredUser?.email ||
                    invite.referredUser?.phone}
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
              Invite friends using your referral link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Share;