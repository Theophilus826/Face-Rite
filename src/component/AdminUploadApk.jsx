import { useEffect, useState } from "react";
import {
  Upload,
  Trash2,
  Download,
  Smartphone,
} from "lucide-react";
import { API } from "../features/Api";

export default function AdminUploadApk() {
  const [version, setVersion] = useState("");
  const [versionCode, setVersionCode] = useState("");
  const [changelog, setChangelog] = useState("");
  const [loading, setLoading] = useState(false);
  const [apks, setApks] = useState([]);

  const loadApks = async () => {
    try {
      const res = await API.get("/admin/apk");

      setApks(res.data.apks || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadApks();
  }, []);

  const uploadApk = async () => {
    try {
      if (!version || !versionCode) {
        return alert("Version and Version Code are required");
      }

      setLoading(true);

      const { data } = await API.post("/admin/apk/upload", {
        version,
        versionCode: Number(versionCode),
        changelog,
        forceUpdate: false,
      });

      console.log(data);

      setVersion("");
      setVersionCode("");
      setChangelog("");

      await loadApks();

      alert("Version added successfully");
    } catch (err) {
      console.error("Create version error:", err);

      alert(
        err?.response?.data?.message ||
        "Failed to create version"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteApk = async (id) => {
    try {
      if (!window.confirm("Delete this version?")) {
        return;
      }

      await API.delete(`/admin/apk/${id}`);

      setApks((prev) =>
        prev.filter((apk) => apk._id !== id)
      );
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        "Delete failed"
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Smartphone />
          App Version Manager
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Version (e.g. 1.0.5)"
            value={version}
            onChange={(e) =>
              setVersion(e.target.value)
            }
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Version Code (e.g. 105)"
            value={versionCode}
            onChange={(e) =>
              setVersionCode(e.target.value)
            }
            className="w-full border p-3 rounded-xl"
          />

          <textarea
            rows={4}
            placeholder="Changelog"
            value={changelog}
            onChange={(e) =>
              setChangelog(e.target.value)
            }
            className="w-full border p-3 rounded-xl"
          />

          <button
            onClick={uploadApk}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
          >
            <Upload size={18} />

            {loading
              ? "Saving..."
              : "Create Version"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow p-6">
        <h2 className="font-bold text-xl mb-4">
          App Versions
        </h2>

        {apks.length === 0 ? (
          <p className="text-gray-500">
            No versions found
          </p>
        ) : (
          <div className="space-y-3">
            {apks.map((apk) => (
              <div
                key={apk._id}
                className="border rounded-2xl p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">
                    Version {apk.version}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Version Code: {apk.versionCode}
                  </p>

                  <p className="text-sm text-gray-500">
                    {apk.changelog}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(
                      apk.createdAt
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={apk.apkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Download size={16} />
                    APK
                  </a>

                  <button
                    onClick={() =>
                      deleteApk(apk._id)
                    }
                    className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}