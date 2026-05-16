import {
  useState,
  useMemo,
} from "react";

import {
  Coins,
  Gift,
} from "lucide-react";

import { API } from "../features/Api";

import GroupReward from "./GroupReward";

export default function GroupAdminPanel({
  groupId,
  group,
  token,
  onRefresh,
}) {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [showAddMembers, setShowAddMembers] =
    useState(false);

  const [toast, setToast] =
    useState("");

  const [claiming, setClaiming] =
    useState(false);

  const [claimAnimation, setClaimAnimation] =
    useState(false);

  /* ================= MEMBERS ================= */

  const groupMembers = useMemo(
    () => group?.members || [],
    [group]
  );

  /* ================= REWARD DATA ================= */

  const totalCoins =
    group?.stats?.totalCoinsDistributed ||
    0;

  const totalMessages =
    group?.stats?.totalMessages || 0;

  const milestone =
    group?.rewards?.messageMilestone ||
    10;

  const nextReward =
    group?.rewards?.messageRewardCoins ||
    20;

  const progress =
    (totalMessages % milestone) *
    (100 / milestone);

  /* ================= TOAST ================= */

  const showToast = (msg) => {
    setToast(msg);

    setTimeout(() => setToast(""), 2500);
  };

  /* ================= LOAD USERS ================= */

  const loadUsers = async () => {
    if (users.length > 0) {
      setShowAddMembers(true);
      return;
    }

    try {
      setLoadingUsers(true);

      const res = await API.get(
        "/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(res.data.users || []);

      setShowAddMembers(true);
    } catch (err) {
      console.error(
        err.response?.data ||
          err.message
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  /* ================= FILTER USERS ================= */

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
          .includes(
            search.toLowerCase()
          )
    );
  }, [
    users,
    groupMembers,
    search,
  ]);

  /* ================= ACTION WRAPPER ================= */

  const runAction = async (
    action,
    successMsg
  ) => {
    try {
      setLoading(true);

      await action();

      await onRefresh?.();

      if (successMsg)
        showToast(successMsg);
    } catch (err) {
      console.error(
        err.response?.data ||
          err.message
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= CLAIM COINS ================= */

  const claimCoins = async () => {
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
      console.error(
        err.response?.data ||
          err.message
      );

      showToast(
        err.response?.data?.message ||
          "Reward unavailable"
      );
    } finally {
      setClaiming(false);
    }
  };

  /* ================= ACTIONS ================= */

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
    }, "Member added & rewards issued 🎉");

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

  const promoteAdmin = (memberId) =>
    runAction(async () => {
      await API.patch(
        `/group/${groupId}/members/${memberId}/role`,
        { role: "admin" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }, "Role updated ⚡");

  /* ================= UI ================= */

  return (
    <div className="p-4 space-y-6 relative">
      {/* ================= TOAST ================= */}

      {toast && (
        <div className="p-3 bg-green-100 text-green-700 rounded-xl text-sm shadow">
          {toast}
        </div>
      )}

      {/* ================= CLAIM REWARD ================= */}

      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">
              Group Reward Pool
            </p>

            <h1 className="text-3xl font-extrabold flex items-center gap-2 mt-1">
              <Coins size={30} />
              {totalCoins}
            </h1>

            <p className="text-sm mt-2 opacity-90">
              {totalMessages} messages
              sent
            </p>
          </div>

          <button
            onClick={claimCoins}
            disabled={
              claiming ||
              totalMessages <
                milestone
            }
            className="bg-white text-orange-500 font-bold px-5 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {claiming
              ? "Claiming..."
              : `Claim +${nextReward}`}
          </button>
        </div>

        {/* ================= PROGRESS ================= */}

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span>
              Reward Progress
            </span>

            <span>
              {totalMessages %
                milestone}
              /{milestone}
            </span>
          </div>

          <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= CLAIM ANIMATION ================= */}

      {claimAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] pointer-events-none">
          <div className="animate-bounce">
            <div className="bg-yellow-400 border-4 border-yellow-300 rounded-3xl px-10 py-6 shadow-2xl">
              <div className="flex flex-col items-center">
                <Gift
                  size={60}
                  className="animate-pulse text-yellow-700"
                />

                <h1 className="text-4xl font-extrabold text-black mt-3">
                  +{nextReward}
                </h1>

                <p className="font-bold text-black">
                  Coins Claimed
                </p>

                <p className="text-sm text-gray-700 mt-1">
                  Group Reward Bonus
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MEMBERS ================= */}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">
            Group Members
          </h2>

          <button
            onClick={loadUsers}
            disabled={loadingUsers}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-all"
          >
            {loadingUsers
              ? "Loading..."
              : showAddMembers
              ? "Refresh Users"
              : "Add Members"}
          </button>
        </div>

        <div className="space-y-2">
          {groupMembers.map(
            (member) => (
              <div
                key={member.user?._id}
                className="flex items-center justify-between border rounded-2xl p-3 bg-white shadow-sm"
              >
                <div>
                  <p className="font-medium">
                    {member.user?.name}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="capitalize">
                      {member.role}
                    </span>

                    <span>
                      •
                    </span>

                    <span className="flex items-center gap-1 text-yellow-600">
                      <Coins
                        size={14}
                      />
                      {
                        member.coinsEarned
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {member.role !==
                    "admin" && (
                    <button
                      disabled={
                        loading
                      }
                      onClick={() =>
                        promoteAdmin(
                          member.user
                            ._id
                        )
                      }
                      className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                    >
                      Promote
                    </button>
                  )}

                  <button
                    disabled={loading}
                    onClick={() =>
                      kickUser(
                        member.user
                          ._id
                      )
                    }
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                  >
                    Kick
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ================= ADD MEMBERS ================= */}

      {showAddMembers && (
        <div>
          <h2 className="font-bold text-lg mb-3">
            Add Members
          </h2>

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-3 mb-3"
          />

          <div className="space-y-2">
            {availableUsers.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between border rounded-2xl p-3 bg-white"
              >
                <p>{u.name}</p>

                <button
                  disabled={loading}
                  onClick={() =>
                    addMember(u._id)
                  }
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            ))}

            {availableUsers.length ===
              0 && (
              <p className="text-sm text-gray-500">
                No users available
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================= REWARD WIDGET ================= */}

      <GroupReward
        group={group}
      />
    </div>
  );
}