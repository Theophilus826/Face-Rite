import { useState, useMemo } from "react";
import {
  Coins,
  Gift,
  Shield,
  Crown,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";

import { API } from "../features/Api";
import GroupReward from "./GroupReward";

export default function GroupAdminPanel({
  groupId,
  group,
  token,
  onRefresh,
  currentUser,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [toast, setToast] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimAnimation, setClaimAnimation] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  /* ================= MEMBERS ================= */

  const groupMembers = useMemo(
    () => group?.members || [],
    [group]
  );

  const myMemberData = useMemo(() => {
    return groupMembers.find(
      (m) =>
        String(m.user?._id) ===
        String(currentUser?._id)
    );
  }, [groupMembers, currentUser]);

  const myRole = myMemberData?.role || "member";

  const isAdmin = myRole === "admin";

  const canModerate =
    myRole === "admin" ||
    myRole === "moderator";

  /* ================= DEBUG ================= */

  console.log({
    currentUser,
    myMemberData,
    myRole,
    isAdmin,
  });

  /* ================= REWARD SETTINGS ================= */

  const rewardEnabled =
    group?.rewards?.enabled ?? true;

  const showToast = (msg) => {
    setToast(msg);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  /* ================= TOGGLE REWARDS ================= */

  const toggleRewards = async () => {
    if (!isAdmin) {
      return showToast(
        "Only admins can change reward settings"
      );
    }

    try {
      setUpdatingSettings(true);

      await API.patch(
        `/group/${groupId}/reward-toggle`,
        {
          enabled: !rewardEnabled,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await onRefresh?.();

      showToast(
        `Rewards ${
          !rewardEnabled
            ? "enabled"
            : "disabled"
        }`
      );
    } catch (err) {
      console.error(
        "TOGGLE ERROR:",
        err.response?.data || err.message
      );

      showToast(
        err.response?.data?.error ||
          "Failed to update reward settings"
      );
    } finally {
      setUpdatingSettings(false);
    }
  };

  /* ================= STATS ================= */

  const totalCoins =
    group?.stats?.totalCoinsDistributed || 0;

  const totalMessages =
    group?.stats?.totalMessages || 0;

  const milestone =
    group?.rewards?.messageMilestone || 10;

  const nextReward =
    group?.rewards?.messageRewardCoins || 20;

  /* ================= USERS ================= */

  const loadUsers = async () => {
    if (!canModerate) return;

    if (users.length > 0) {
      setShowAddMembers(true);
      return;
    }

    try {
      setLoadingUsers(true);

      const res = await API.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data.users || []);

      setShowAddMembers(true);
    } catch (err) {
      console.error(err);

      showToast("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const availableUsers = useMemo(() => {
    return users.filter(
      (u) =>
        !groupMembers.some(
          (m) =>
            String(m.user?._id) ===
            String(u._id)
        ) &&
        u.name
          ?.toLowerCase()
          .includes(search.toLowerCase())
    );
  }, [users, groupMembers, search]);

  /* ================= ACTION WRAPPER ================= */

  const runAction = async (action, msg) => {
    try {
      setLoading(true);

      await action();

      await onRefresh?.();

      if (msg) {
        showToast(msg);
      }
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.error ||
          "Action failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= CLAIM REWARDS ================= */

  const claimCoins = async () => {
    if (!rewardEnabled) {
      return showToast(
        "Rewards are disabled"
      );
    }

    try {
      setClaiming(true);

      const res = await API.post(
        `/group/${groupId}/claim-reward`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setClaimAnimation(true);

      setTimeout(() => {
        setClaimAnimation(false);
      }, 3000);

      showToast(
        `+${res.data.coins} coins claimed 🎉`
      );

      await onRefresh?.();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.error ||
          "Reward unavailable"
      );
    } finally {
      setClaiming(false);
    }
  };

  /* ================= MEMBER ACTIONS ================= */

  const addMember = (memberId) =>
    runAction(async () => {
      await API.post(
        `/group/${groupId}/members`,
        { memberId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers((prev) =>
        prev.filter(
          (u) => u._id !== memberId
        )
      );
    }, "Member added");

  const kickUser = (memberId) =>
    runAction(async () => {
      await API.delete(
        `/group/${groupId}/members/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }, "Member removed");

  const changeRole = (memberId, role) =>
    runAction(async () => {
      await API.patch(
        `/group/${groupId}/members/${memberId}/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }, `Role changed to ${role}`);

  /* ================= ROLE BADGE ================= */

  const RoleBadge = ({ role }) => {
    if (role === "admin") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
          <Crown size={12} />
          Admin
        </span>
      );
    }

    if (role === "moderator") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
          <Shield size={12} />
          Mod
        </span>
      );
    }

    return (
      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
        Member
      </span>
    );
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6 p-4">
      
      {/* ================= TOAST ================= */}

      {toast && (
        <div className="rounded-xl bg-green-100 p-3 text-sm text-green-700">
          {toast}
        </div>
      )}

      {/* ================= REWARD SETTINGS ================= */}

      {isAdmin && (
        <div className="rounded-2xl border bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-yellow-100 p-2">
                <Gift
                  size={18}
                  className="text-yellow-600"
                />
              </div>

              <div>
                <h3 className="font-semibold">
                  Group Rewards
                </h3>

                <p className="text-sm text-gray-500">
                  Enable or disable rewards
                  for members
                </p>
              </div>
            </div>

            <button
              onClick={toggleRewards}
              disabled={updatingSettings}
              className="transition hover:scale-105"
            >
              {updatingSettings ? (
                <Loader2 className="animate-spin text-gray-500" />
              ) : rewardEnabled ? (
                <ToggleRight
                  size={36}
                  className="text-green-500"
                />
              ) : (
                <ToggleLeft
                  size={36}
                  className="text-gray-400"
                />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= REWARD CARD ================= */}

      <div className="rounded-3xl bg-gradient-to-r from-yellow-400 to-orange-500 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          
          <div>
            <h2 className="flex items-center gap-2 text-3xl font-bold">
              <Coins />
              {totalCoins}
            </h2>

            <p className="mt-1 text-sm opacity-90">
              {totalMessages} messages
            </p>
          </div>

          <button
            disabled={
              !rewardEnabled || claiming
            }
            onClick={claimCoins}
            className="rounded-xl bg-white px-4 py-2 font-bold text-orange-500 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {claiming
              ? "Claiming..."
              : `Claim +${nextReward}`}
          </button>
        </div>
      </div>

      {/* ================= MEMBERS ================= */}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Members
          </h2>

          {canModerate && (
            <button
              onClick={loadUsers}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            >
              Add Members
            </button>
          )}
        </div>

        <div className="space-y-3">
          {groupMembers.map((m) => (
            <div
              key={m.user?._id}
              className="flex items-center justify-between rounded-2xl border p-3"
            >
              <div>
                <p className="font-medium">
                  {m.user?.name}
                </p>

                <div className="mt-1">
                  <RoleBadge role={m.role} />
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  
                  {m.role !== "admin" && (
                    <button
                      onClick={() =>
                        changeRole(
                          m.user._id,
                          "admin"
                        )
                      }
                      className="rounded-lg bg-yellow-500 px-2 py-1 text-xs text-white"
                    >
                      Admin
                    </button>
                  )}

                  {m.role !== "moderator" && (
                    <button
                      onClick={() =>
                        changeRole(
                          m.user._id,
                          "moderator"
                        )
                      }
                      className="rounded-lg bg-purple-500 px-2 py-1 text-xs text-white"
                    >
                      Mod
                    </button>
                  )}

                  <button
                    onClick={() =>
                      kickUser(m.user._id)
                    }
                    className="rounded-lg bg-red-500 px-2 py-1 text-xs text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= REWARD WIDGET ================= */}

      {rewardEnabled && (
        <GroupReward group={group} />
      )}
    </div>
  );
}