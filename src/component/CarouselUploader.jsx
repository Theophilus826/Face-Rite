import { useState } from "react";

function CarouselUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const API_BASE = "https://swordgame-5.onrender.com";

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const uploadImage = async () => {
    if (!file) return alert("Select an image first");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `${API_BASE}/api/admin/carousel/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Upload failed");
      }

      alert("✅ Uploaded to carousel!");

      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">

      {/* File Input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="p-2 border rounded"
      />

      {/* Preview */}
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="w-40 h-24 object-cover rounded border"
        />
      )}

      {/* Upload Button */}
      <button
        onClick={uploadImage}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload to Carousel"}
      </button>
    </div>
  );
}

export default CarouselUploader;