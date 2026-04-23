import { useState, useEffect, useRef } from "react";

const API_BASE = "https://swordgame-5.onrender.com";

export default function Carousel() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  /* ================= LOAD SLIDES ================= */
  const loadSlides = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/carousel/slides`);
      const data = await res.json();
      setSlides(data?.slides || []);
    } catch (err) {
      console.error("Error loading slides:", err);
      setSlides([]);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  useEffect(() => {
    setCurrent(0);
  }, [slides]);

  /* ================= AUTO SLIDE ================= */
  useEffect(() => {
    if (slides.length < 2) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  /* ================= UPLOAD MULTIPLE ================= */
  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const uploadImages = async () => {
    if (!files.length) return alert("Select images first");

    setUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("images", file); // 👈 MUST match backend name
        });

        const res = await fetch(`${API_BASE}/api/admin/carousel/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Upload failed");
        }
      }

      alert("✅ Upload complete!");

      setFiles([]);
      await loadSlides(); // refresh carousel
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteSlide = async (id) => {
    if (!window.confirm("Delete this slide?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/carousel/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Delete failed");

      setSlides((prev) => prev.filter((s) => s._id !== id));
      setCurrent(0);
    } catch (err) {
      console.error(err);
      alert("❌ Delete failed");
    }
  };

  /* ================= TOUCH ================= */
  const handleTouchStart = (e) => {
    touchStart.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEnd.current = e.changedTouches[0].clientX;

    const diff = touchStart.current - touchEnd.current;

    if (diff > 50) setCurrent((p) => (p + 1) % slides.length);
    if (diff < -50) setCurrent((p) => (p === 0 ? slides.length - 1 : p - 1));
  };

  /* ================= EMPTY ================= */
  if (!slides.length) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center gap-3">
        <p>No slides found</p>
      </div>
    );
  }

  const activeSlide = slides[current];

  return (
    <div className="flex flex-col gap-4">
      {/* ================= UPLOAD (ALWAYS VISIBLE) ================= */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col gap-3">
        <h2 className="font-semibold">📤 Upload Carousel Images</h2>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="border p-2 rounded"
        />

        <button
          onClick={uploadImages}
          disabled={uploading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Images"}
        </button>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {slides.length === 0 ? (
        <div className="w-full h-48 flex items-center justify-center text-gray-500">
          No slides yet — upload above 👆
        </div>
      ) : (
        /* ================= CAROUSEL ================= */
        <div
          className="relative w-full overflow-hidden rounded-xl h-64 md:h-[400px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={slides[current]?.src}
            alt="slide"
            className="w-full h-full object-cover"
          />

          <button
            onClick={() => deleteSlide(slides[current]._id)}
            className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 text-xs rounded"
          >
            🗑 Delete
          </button>

          <button
            onClick={() =>
              setCurrent((p) => (p === 0 ? slides.length - 1 : p - 1))
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full"
          >
            ❮
          </button>

          <button
            onClick={() => setCurrent((p) => (p + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full"
          >
            ❯
          </button>
        </div>
      )}
    </div>
  );
}
