import { AdMob } from "@capacitor-community/admob";

const rewardedId = "ca-app-pub-6698884898009230/7549505928";

export default function RewardButton() {

  const showRewardAd = async () => {

    try {

      await AdMob.prepareRewardVideoAd({
        adId: rewardedId,
        isTesting: true,
      });

      await AdMob.showRewardVideoAd();

      console.log("Reward ad shown");

    } catch (error) {

      console.log("Ad error:", error);
    }
  };

  return (
    <button onClick={showRewardAd}>
      Watch Ad for Reward
    </button>
  );
}