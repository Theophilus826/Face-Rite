import { AdvancedDynamicTexture, Rectangle, Button, TextBlock } from "@babylonjs/gui";
import { GameState } from "../scenes/GameState";

export function createGameMenu(scene, { onStart, onExit }) {
  GameState.pause(scene);

  const ui = AdvancedDynamicTexture.CreateFullscreenUI("MainMenuUI", true, scene);

  const bg = new Rectangle();
  bg.width = "100%";
  bg.height = "100%";
  bg.background = "black";
  bg.alpha = 0.8;
  ui.addControl(bg);

  const title = new TextBlock("title", "MY GAME");
  title.color = "white";
  title.fontSize = 60;
  title.top = "-120px";
  bg.addControl(title);

  const startBtn = Button.CreateSimpleButton("start", "START");
  startBtn.width = "220px";
  startBtn.height = "60px";
  startBtn.top = "20px";
  bg.addControl(startBtn);

  startBtn.onPointerUpObservable.add(() => {
    ui.dispose();
    GameState.resume();
    onStart?.();
  });

  return ui;
}
