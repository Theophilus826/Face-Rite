import { useEffect, useState } from "react";
import {
  Download,
  Smartphone,
  Calendar,
  HardDrive,
  ShieldCheck,
} from "lucide-react";
import { API } from "../features/Api";

export default function DownloadPage() {
  const [apk, setApk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestApk();
  }, []);

  const loadLatestApk = async () => {
    try {
      const res = await API.get("/admin/apk/latest");

      setApk(res.data.apk);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading latest version...
      </div>
    );
  }

  if (!apk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No APK available.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">

      <div className="max-w-2xl mx-auto">

        {/* HEADER */}

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-3xl p-8 shadow-xl">

          <div className="flex flex-col items-center text-center">

            <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center mb-4">
              <Smartphone
                size={50}
                className="text-blue-600"
              />
            </div>

            <h1 className="text-3xl font-bold">
              TinkReward
            </h1>

            <p className="text-blue-100 mt-2">
              Download the latest Android version
            </p>

            <div className="mt-4 bg-white/20 px-4 py-2 rounded-full">
              Version {apk.version}
            </div>

          </div>
        </div>

        {/* APK CARD */}

        <div className="bg-white rounded-3xl shadow-lg mt-6 p-6">

          <h2 className="text-xl font-bold mb-4">
            Latest Release
          </h2>

          <div className="space-y-3">

            <div className="flex items-center gap-3">
              <Calendar size={18} />
              <span>
                Released:
                {" "}
                {new Date(
                  apk.createdAt
                ).toLocaleDateString()}
              </span>
            </div>

            {apk.size && (
              <div className="flex items-center gap-3">
                <HardDrive size={18} />
                <span>{apk.size}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <ShieldCheck size={18} />
              <span>Verified Build</span>
            </div>

          </div>

          {/* RELEASE NOTES */}

          <div className="mt-6">

            <h3 className="font-semibold mb-2">
              What's New
            </h3>

            <div className="bg-gray-50 rounded-2xl p-4 text-gray-700 whitespace-pre-wrap">
              {apk.description ||
                "Performance improvements and bug fixes."}
            </div>

          </div>

          {/* DOWNLOAD BUTTON */}

          <a
            href={apk.apkUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition"
          >
            <Download size={22} />
            Download APK
          </a>

          <p className="text-center text-xs text-gray-500 mt-4">
            Android installation may require enabling
            "Install Unknown Apps" in your device settings.
          </p>

        </div>

      </div>

    </div>
  );
}