import { AdvancedDynamicTexture, Rectangle, TextBlock, Button } from "@babylonjs/gui";
import { creditCoins } from "../features/coins/CoinSlice.js";
import { toast } from "react-toastify";

export async function showEndScreen(
  scene,
  text,
  winnerId,
  onContinue,
  game,
  user,
  dispatch
) {
  // Prevent duplicate UI
  if (scene._endScreenUI) return scene._endScreenUI;

  const ui = AdvancedDynamicTexture.CreateFullscreenUI("EndScreenUI");
  scene._endScreenUI = ui;

  /* ===================== BACKGROUND ===================== */
  const bg = new Rectangle();
  bg.width = "100%";
  bg.height = "100%";
  bg.thickness = 0;
  bg.background = "black";
  bg.alpha = 0.85;
  ui.addControl(bg);

  /* ===================== TITLE ===================== */
  const title = new TextBlock();
  title.text = text || "GAME OVER";
  title.color = "white";
  title.fontSize = 64;
  title.fontWeight = "bold";
  title.top = "-80px";
  bg.addControl(title);

  /* ===================== WINNER TEXT ===================== */
  const winnerText = new TextBlock();
  winnerText.text =
    winnerId === user?._id ? "Winner: YOU" : `Winner: ${winnerId}`;
  winnerText.color = "white";
  winnerText.fontSize = 30;
  winnerText.top = "-10px";
  bg.addControl(winnerText);

  /* ===================== COIN CREDIT ===================== */
  let coinsText = null;

  if (winnerId === user?._id && game?.pot && dispatch) {
    const winAmount = Number(game.pot);

    if (!isNaN(winAmount) && winAmount > 0) {
      try {
        // Prevent double credit
        if (!scene._coinsCredited) {
          scene._coinsCredited = true;

          await dispatch(
            creditCoins({
              coins: winAmount,
            })
          ).unwrap();

          toast.success(`🎉 Coins credited: +${winAmount}`);
        }

        coinsText = new TextBlock();
        coinsText.text = `Coins Won: +${winAmount}`;
        coinsText.color = "gold";
        coinsText.fontSize = 36;
        coinsText.top = "60px";

        bg.addControl(coinsText);
      } catch (err) {
        console.error("Failed to credit coins:", err);
        toast.error(err?.message || "Failed to credit coins");
      }
    }
  }

  /* ===================== CONTINUE BUTTON ===================== */
  const continueBtn = Button.CreateSimpleButton("continueBtn", "CONTINUE");

  continueBtn.width = "240px";
  continueBtn.height = "65px";
  continueBtn.color = "white";
  continueBtn.background = "#1e88e5";
  continueBtn.cornerRadius = 12;
  continueBtn.fontSize = 24;

  continueBtn.top = coinsText ? "140px" : "110px";

  bg.addControl(continueBtn);

  continueBtn.onPointerEnterObservable.add(() => {
    continueBtn.background = "#1565c0";
  });

  continueBtn.onPointerOutObservable.add(() => {
    continueBtn.background = "#1e88e5";
  });

  continueBtn.onPointerUpObservable.add(() => {
    if (scene._endScreenUI) {
      scene._endScreenUI.dispose();
      scene._endScreenUI = null;
    }

    if (onContinue) {
      onContinue(winnerId);
    }
  });

  return ui;
}
