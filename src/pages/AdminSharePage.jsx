import React, { useEffect, useState } from "react";
import API from "../features/Api";

function AdminSharePage() {
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    referralsRequired: 5,
    rewardCoins: 10,
  });

  const [referrals, setReferrals] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [settingsRes, referralRes] = await Promise.all([
        API.get("/share/admin/settings"),
        API.get("/share/admin/referrals"),
      ]);

      setSettings(settingsRes.data.settings);
      setReferrals(referralRes.data.referrals);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveSettings = async () => {
    try {
      await API.put("/share/admin/settings", settings);

      alert("Settings updated");
    } catch (err) {
      console.log(err);
    }
  };

  const rewardReferral = async (id) => {
    try {
      await API.post(`/share/admin/reward/${id}`);

      loadData();
    } catch (err) {
      console.log(err);
    }
  };

  if (loading)
    return (
      <div className="p-8">
        Loading...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-8">
        Referral Admin
      </h1>

      {/* SETTINGS */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-xl font-bold mb-4">
          Reward Settings
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <div>
            <label className="block mb-2">
              Referrals Required
            </label>

            <input
              type="number"
              value={settings.referralsRequired}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  referralsRequired: Number(e.target.value),
                })
              }
              className="border rounded p-2 w-full"
            />
          </div>

          <div>
            <label className="block mb-2">
              Reward Coins
            </label>

            <input
              type="number"
              value={settings.rewardCoins}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  rewardCoins: Number(e.target.value),
                })
              }
              className="border rounded p-2 w-full"
            />
          </div>

        </div>

        <button
          onClick={saveSettings}
          className="mt-5 px-5 py-2 bg-blue-600 text-white rounded"
        >
          Save Settings
        </button>

      </div>

      {/* REFERRALS */}

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-bold mb-5">
          All Referrals
        </h2>

        <table className="w-full border-collapse">

          <thead>

            <tr className="border-b">

              <th className="text-left p-3">Referrer</th>

              <th className="text-left p-3">Invitee</th>

              <th className="text-left p-3">Completed</th>

              <th className="text-left p-3">Rewarded</th>

              <th className="text-left p-3">Action</th>

            </tr>

          </thead>

          <tbody>

            {referrals.map((item) => (

              <tr key={item._id} className="border-b">

                <td className="p-3">
                  {item.referrer?.name}
                </td>

                <td className="p-3">
                  {item.referredUser?.name}
                </td>

                <td className="p-3">
                  {item.completed ? "✅" : "❌"}
                </td>

                <td className="p-3">
                  {item.rewarded ? "✅" : "❌"}
                </td>

                <td className="p-3">

                  {!item.rewarded &&
                    item.completed && (

                      <button
                        onClick={() =>
                          rewardReferral(item._id)
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Reward
                      </button>

                    )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default AdminSharePage;