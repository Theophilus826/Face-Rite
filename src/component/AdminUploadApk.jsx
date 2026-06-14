import { useEffect, useState } from "react";
import { Upload, Trash2, Download, Smartphone } from "lucide-react";
import { API } from "../features/Api";

export default function AdminUploadApk() {
  const [apk, setApk] = useState(null);
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
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
      if (!apk) {
        return alert("Select APK file");
      }

      const formData = new FormData();

      formData.append("apk", apk);
      formData.append("version", version);
      formData.append("description", description);

      setLoading(true);

      await API.post(
        "/admin/apk/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setApk(null);
      setVersion("");
      setDescription("");

      document.getElementById("apkFile").value = "";

      await loadApks();

      alert("APK uploaded successfully");
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteApk = async (id) => {
    try {
      if (
        !window.confirm(
          "Delete this APK?"
        )
      ) {
        return;
      }

      await API.delete(
        `/admin/apk/${id}`
      );

      await loadApks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white rounded-3xl shadow p-6 mb-6">

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Smartphone />
          Android APK Manager
        </h1>

        <div className="space-y-4">

          <input
            id="apkFile"
            type="file"
            accept=".apk"
            onChange={(e) =>
              setApk(
                e.target.files?.[0] || null
              )
            }
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Version (e.g 1.0.5)"
            value={version}
            onChange={(e) =>
              setVersion(e.target.value)
            }
            className="w-full border p-3 rounded-xl"
          />

          <textarea
            rows={4}
            placeholder="Update description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
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
              ? "Uploading..."
              : "Upload APK"}
          </button>

        </div>
      </div>

      <div className="bg-white rounded-3xl shadow p-6">

        <h2 className="font-bold text-xl mb-4">
          Uploaded APKs
        </h2>

        {apks.length === 0 ? (
          <p className="text-gray-500">
            No APK uploaded
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
                    {apk.description}
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
                    Download
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