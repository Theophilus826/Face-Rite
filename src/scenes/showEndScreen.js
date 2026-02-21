import { AdvancedDynamicTexture, Rectangle, TextBlock, Button } from "@babylonjs/gui";
import { creditCoins } from "../features/coins/CoinSlice.js";
import { toast } from "react-toastify";

export async function showEndScreen(scene, text, winnerId, onContinue, game, user, dispatch) {
  if (scene._endScreenUI) return scene._endScreenUI;

  const ui = AdvancedDynamicTexture.CreateFullscreenUI("EndScreenUI");
  scene._endScreenUI = ui;

  /* ===================== BACKGROUND ===================== */
  const bg = new Rectangle();
  bg.width = "100%";
  bg.height = "100%";
  bg.thickness = 0;
  bg.background = "black";
  bg.alpha = 0.8;
  ui.addControl(bg);

  /* ===================== TITLE ===================== */
  const title = new TextBlock();
  title.text = text;
  title.color = "white";
  title.fontSize = 60;
  title.top = "-50px";
  bg.addControl(title);

  /* ===================== WINNER TEXT ===================== */
  const winnerText = new TextBlock();
  winnerText.text = `Winner: ${winnerId}`;
  winnerText.color = "white";
  winnerText.fontSize = 28;
  winnerText.top = "10px";
  bg.addControl(winnerText);

  /* ===================== COIN CREDIT LOGIC ===================== */
  let coinsText;

  if (winnerId === user?._id && game?.pot && dispatch) {
    const winAmount = Number(game.pot);

    if (!isNaN(winAmount) && winAmount > 0) {
      try {
        // ✅ DO NOT pass headers here
        await dispatch(
          creditCoins({ coins: winAmount })
        ).unwrap();

        toast.success(`🎉 Coins credited: +${winAmount}`);

        coinsText = new TextBlock();
        coinsText.text = `Coins won: +${winAmount}`;
        coinsText.color = "gold";
        coinsText.fontSize = 32;
        coinsText.top = "60px";
        bg.addControl(coinsText);

      } catch (err) {
        console.error("Failed to credit coins", err);
        toast.error(err || "Failed to credit coins");
      }
    }
  }

  /* ===================== CONTINUE BUTTON ===================== */
  const continueBtn = Button.CreateSimpleButton("continueBtn", "CONTINUE");

  continueBtn.width = "220px";
  continueBtn.height = "60px";
  continueBtn.color = "white";
  continueBtn.background = "blue";
  continueBtn.top = coinsText ? "120px" : "100px";
  continueBtn.cornerRadius = 10;

  bg.addControl(continueBtn);

  continueBtn.onPointerUpObservable.add(() => {
    ui.dispose();
    scene._endScreenUI = null;

    if (onContinue) onContinue(winnerId);
  });

  return ui;
}
