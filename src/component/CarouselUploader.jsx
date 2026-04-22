import { useState, useEffect, useRef } from "react";

const API_BASE = "https://swordgame-5.onrender.com";

export default function Carousel() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);

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

  /* ================= NAVIGATION ================= */
  const nextSlide = () => {
    if (!slides.length) return;
    setCurrent((p) => (p + 1) % slides.length);
  };

  const prevSlide = () => {
    if (!slides.length) return;
    setCurrent((p) => (p === 0 ? slides.length - 1 : p - 1));
  };

  /* ================= DELETE SLIDE ================= */
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

      // remove from UI instantly
      setSlides((prev) => prev.filter((s) => s._id !== id));

      // reset index safely
      setCurrent(0);
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Failed to delete slide");
    }
  };

  /* ================= TOUCH ================= */
  const handleTouchStart = (e) => {
    touchStart.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEnd.current = e.changedTouches[0].clientX;

    const diff = touchStart.current - touchEnd.current;

    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
  };

  /* ================= EMPTY ================= */
  if (!slides.length) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        No slides found
      </div>
    );
  }

  const activeSlide = slides[current];

  return (
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

      {/* DELETE BUTTON (ADMIN TOOL) */}
      <button
        onClick={() => deleteSlide(activeSlide._id)}
        className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 text-xs rounded"
      >
        🗑 Delete
      </button>

      {/* PREV */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full"
      >
        ❮
      </button>

      {/* NEXT */}
      <button
        onClick={nextSlide}
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
  );
}