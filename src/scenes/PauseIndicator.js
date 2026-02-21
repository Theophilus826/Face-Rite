// src/ui/PauseIndicator.js
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { GameState } from "./GameState.js";

export function createPauseIndicator(scene) {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI(
    "PauseIndicatorUI",
    true,
    scene
  );

  const icon = new TextBlock();
  icon.text = "⏸";
  icon.fontSize = 36;
  icon.color = "white";
  icon.top = "20px";
  icon.horizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
  icon.verticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
  icon.isVisible = false;
  icon.horizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_RIGHT;
icon.left = "-30px";

icon.alpha = GameState.isPaused() ? 1 : 0;
icon.isPointerBlocker = true;
icon.onPointerUpObservable.add(() => {
  if (GameState.isPaused()) GameState.resume();
});

  ui.addControl(icon);

  // Update visibility every frame
  scene.onBeforeRenderObservable.add(() => {
    icon.isVisible = GameState.isPaused();
  });

  return ui;
}
