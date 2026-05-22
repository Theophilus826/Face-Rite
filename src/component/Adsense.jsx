import { useEffect } from "react";

const Adsense = ({ slot }) => {
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
  }, []);

  return (
    <div className="my-6 w-full overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          minHeight: "250px",
        }}
        data-ad-client="ca-pub-6698884898009230"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default Adsense;