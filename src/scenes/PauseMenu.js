import { AdvancedDynamicTexture, Rectangle, TextBlock, Button } from "@babylonjs/gui";
import { GameState } from "../scenes/GameState";

export function PauseMenu(scene, onResume, onRestart, onMainMenu) {
  GameState.pause(scene);

  const ui = AdvancedDynamicTexture.CreateFullscreenUI("PauseUI", true, scene);

  const bg = new Rectangle();
  bg.width = "100%";
  bg.height = "100%";
  bg.thickness = 0;
  bg.background = "black";
  bg.alpha = 0.7;
  ui.addControl(bg);

  const title = new TextBlock();
  title.text = "⏸ PAUSED";
  title.color = "white";
  title.fontSize = 48;
  title.top = "-120px";
  bg.addControl(title);

  function makeButton(text, top, color) {
    const btn = Button.CreateSimpleButton(text, text);
    btn.width = "240px";
    btn.height = "60px";
    btn.color = "white";
    btn.background = color;
    btn.top = top;
    btn.cornerRadius = 10;
    bg.addControl(btn);
    return btn;
  }

  const resumeBtn = makeButton("RESUME", "-20px", "green");
  const restartBtn = makeButton("RESTART", "60px", "orange");
  const menuBtn = makeButton("MAIN MENU", "140px", "red");

  resumeBtn.onPointerUpObservable.add(() => {
    ui.dispose();
    GameState.resume();
    onResume?.();
  });

  restartBtn.onPointerUpObservable.add(() => {
    ui.dispose();
    GameState.resume();
    onRestart?.();
  });

  menuBtn.onPointerUpObservable.add(() => {
    ui.dispose();
    GameState.resume();
    onMainMenu?.();
  });

  return ui;
}
