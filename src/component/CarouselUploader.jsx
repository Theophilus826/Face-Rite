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
      const res = await fetch(
        `${API_BASE}/api/admin/carousel/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

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
    <div className="flex flex-col gap-3">

      {/* ================= UPLOAD SECTION (ABOVE DELETE) ================= */}
      <div className="bg-white p-3 rounded shadow flex flex-col gap-2">
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

      {/* ================= CAROUSEL ================= */}
      <div
        className="relative w-full overflow-hidden rounded-xl aspect-[16/9] h-48 sm:h-64 md:h-[400px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* IMAGE */}
        <img
          src={activeSlide?.src}
          alt="slide"
          className="w-full h-full object-cover transition duration-700"
        />

        {/* DELETE BUTTON */}
        <button
          onClick={() => deleteSlide(activeSlide._id)}
          className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 text-xs rounded"
        >
          🗑 Delete
        </button>

        {/* PREV */}
        <button
          onClick={() =>
            setCurrent((p) => (p === 0 ? slides.length - 1 : p - 1))
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full"
        >
          ❮
        </button>

        {/* NEXT */}
        <button
          onClick={() => setCurrent((p) => (p + 1) % slides.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full"
        >
          ❯
        </button>

        {/* INDICATORS */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2.5 w-2.5 rounded-full ${
                current === i ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}