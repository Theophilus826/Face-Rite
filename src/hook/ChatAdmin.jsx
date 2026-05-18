import { useState, useMemo } from "react";
import {
  Coins,
  Gift,
  Shield,
  Crown,
  UserPlus,
  Trash2,
  ToggleLeft,
  ToggleRight,
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
  const groupMembers = useMemo(() => group?.members || [], [group]);

  const myMemberData = useMemo(() => {
    return groupMembers.find(
      (m) => String(m.user?._id) === String(currentUser?._id)
    );
  }, [groupMembers, currentUser]);

  const myRole = myMemberData?.role || "member";
  const isAdmin = myRole === "admin";
  const canModerate = isAdmin || myRole === "moderator";

  /* ================= REWARD SETTINGS (TOGGLE SYSTEM) ================= */
  const rewardEnabled = group?.settings?.allowRewards ?? true;

  const toggleRewards = async () => {
    if (!isAdmin) return;

    try {
      setUpdatingSettings(true);

      await API.patch(
        `/group/${groupId}/settings`,
        { allowRewards: !rewardEnabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await onRefresh?.();
      showToast(
        `Rewards ${!rewardEnabled ? "enabled" : "disabled"}`
      );
    } catch (err) {
      showToast("Failed to update settings");
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

  const progress =
    ((totalMessages % milestone) * 100) / milestone;

  /* ================= TOAST ================= */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

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
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data.users || []);
      setShowAddMembers(true);
    } catch {
      showToast("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const availableUsers = useMemo(() => {
    return users.filter(
      (u) =>
        !groupMembers.some(
          (m) => String(m.user?._id) === String(u._id)
        ) &&
        u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, groupMembers, search]);

  /* ================= ACTION WRAPPER ================= */
  const runAction = async (action, msg) => {
    try {
      setLoading(true);
      await action();
      await onRefresh?.();
      if (msg) showToast(msg);
    } catch {
      showToast("Action failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= REWARD CLAIM ================= */
  const claimCoins = async () => {
    if (!rewardEnabled) {
      return showToast("Rewards are disabled");
    }

    try {
      setClaiming(true);

      const res = await API.post(
        `/group/${groupId}/claim-reward`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClaimAnimation(true);
      setTimeout(() => setClaimAnimation(false), 3000);

      showToast(`+${res.data.coins} coins claimed 🎉`);
      await onRefresh?.();
    } catch {
      showToast("Reward unavailable");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) => prev.filter((u) => u._id !== memberId));
    }, "Member added");

  const kickUser = (memberId) =>
    runAction(async () => {
      await API.delete(
        `/group/${groupId}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }, "Member removed");

  const changeRole = (memberId, role) =>
    runAction(async () => {
      await API.patch(
        `/group/${groupId}/members/${memberId}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }, "Role updated");

  /* ================= ROLE BADGE ================= */
  const RoleBadge = ({ role }) => {
    if (role === "admin")
      return (
        <span className="flex items-center gap-1 text-yellow-600 text-xs bg-yellow-100 px-2 py-1 rounded-full">
          <Crown size={12} /> Admin
        </span>
      );

    if (role === "moderator")
      return (
        <span className="flex items-center gap-1 text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded-full">
          <Shield size={12} /> Mod
        </span>
      );

    return (
      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
        Member
      </span>
    );
  };

  /* ================= UI ================= */
  return (
    <div className="p-4 space-y-6">

      {/* ================= SETTINGS (REWARD TOGGLE) ================= */}
      {isAdmin && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border">
          <div className="flex items-center gap-2">
            <Gift size={18} />
            <span className="font-medium">
              Group Rewards
            </span>
          </div>

          <button
            onClick={toggleRewards}
            disabled={updatingSettings}
            className="flex items-center gap-2"
          >
            {rewardEnabled ? (
              <ToggleRight className="text-green-500" />
            ) : (
              <ToggleLeft className="text-gray-400" />
            )}
          </button>
        </div>
      )}

      {/* ================= CLAIM ================= */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-5 rounded-3xl text-white">
        <div className="flex justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Coins /> {totalCoins}
            </h2>
            <p>{totalMessages} messages</p>
          </div>

          <button
            disabled={!rewardEnabled || claiming}
            onClick={claimCoins}
            className="bg-white text-orange-500 px-4 py-2 rounded-xl font-bold disabled:opacity-50"
          >
            Claim +{nextReward}
          </button>
        </div>
      </div>

      {/* ================= MEMBERS ================= */}
      <div>
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">Members</h2>

          {canModerate && (
            <button onClick={loadUsers}>
              <UserPlus />
            </button>
          )}
        </div>

        {groupMembers.map((m) => (
          <div key={m.user?._id} className="flex justify-between p-3 border rounded-xl">
            <div>
              <p className="font-medium">{m.user?.name}</p>
              <RoleBadge role={m.role} />
            </div>

            {canModerate && (
              <div className="flex gap-2">
                <button onClick={() => changeRole(m.user._id, "moderator")}>
                  Mod
                </button>
                <button onClick={() => kickUser(m.user._id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ================= REWARD WIDGET ================= */}
      <GroupReward group={group} />
    </div>
  );
}