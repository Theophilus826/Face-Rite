import { useEffect } from "react";

const Adsense = ({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style = {},
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
        }
      } catch (err) {
        console.log("Adsense error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slot]);

  return (
    <div
      className={`w-full overflow-hidden my-6 ${className}`}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          minHeight: "250px",
          ...style,
        }}
        data-ad-client="ca-pub-6698884898009230"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};

export default Adsense;