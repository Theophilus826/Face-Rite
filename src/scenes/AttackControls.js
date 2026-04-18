import {
  AdvancedDynamicTexture,
  Rectangle,
  TextBlock,
  Control,
  StackPanel,
} from "@babylonjs/gui";

/**
 * Sets up UI buttons + keyboard attacks + camera arrows
 */
export function setupAttackControls(scene, player, enemies, camera) {
  // ✅ Reuse UI (persistent)
  let ui = scene.__attackUI;

  if (!ui) {
    ui = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    ui.idealWidth = 1920;
    ui.renderAtIdealSize = true;
    scene.__attackUI = ui;
  }

  // ✅ Prevent duplicate creation
  if (scene.__attackControlsCreated) return;
  scene.__attackControlsCreated = true;

  const isMobile = window.innerWidth < 768;

  // ================= ATTACK BUTTON CONTAINER =================
  const container = new StackPanel();
  container.isVertical = false;
  container.height = isMobile ? "110px" : "70px";

  container.horizontalAlignment = isMobile
    ? Control.HORIZONTAL_ALIGNMENT_RIGHT
    : Control.HORIZONTAL_ALIGNMENT_CENTER;

  container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  container.spacing = isMobile ? 20 : 10;

  // ✅ Always visible spacing
  container.paddingBottom = isMobile ? "40px" : "10px";
  if (isMobile) container.paddingRight = "20px";

  container.zIndex = 1000;

  ui.addControl(container);

  // ================= BUTTONS =================
  const lightBtn = createButton("J\nLight", "orange", isMobile);
  const heavyBtn = createButton("K\nHeavy", "red", isMobile);
  const blockBtn = createButton("L\nBlock", "cyan", isMobile);

  container.addControl(lightBtn);
  container.addControl(heavyBtn);
  container.addControl(blockBtn);

  // ================= HELPERS =================
  function getHitEnemy() {
    return enemies.find(
      (enemy) =>
        enemy.currentHealth > 0 &&
        player.characterBox.intersectsMesh(enemy.enemyBox, false),
    );
  }

  function flashButton(button, flashColor) {
    const original = button.background;
    button.background = flashColor;

    setTimeout(() => {
      button.background = original;
    }, 120);
  }

  function applyDamage(base, heavy = false) {
    const hitEnemy = getHitEnemy();
    if (!hitEnemy) return;

    const finalDamage = hitEnemy.characterController.receiveDamage(base, heavy);

    hitEnemy.takeDamage(finalDamage);
  }

  // ================= BUTTON EVENTS =================
  lightBtn.onPointerClickObservable.add(() => {
    player.controller.attack(false);
    applyDamage(10, false);
    flashButton(lightBtn, "orange");
  });

  heavyBtn.onPointerClickObservable.add(() => {
    player.controller.attack(true);
    applyDamage(20, true);
    flashButton(heavyBtn, "red");
  });

  blockBtn.onPointerDownObservable.add(() => {
    player.controller.block();
    flashButton(blockBtn, "cyan");
  });

  blockBtn.onPointerUpObservable.add(() => {
    player.controller.unblock();
  });

   // ================= ARROW CONTROLS (MOBILE ONLY) =================
if (isMobile && camera) {
  const arrowContainer = new StackPanel();
  arrowContainer.width = "180px";
  arrowContainer.height = "180px";
  arrowContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  arrowContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  arrowContainer.paddingLeft = "20px";
  arrowContainer.paddingBottom = "100px";
  arrowContainer.zIndex = 1000;
  ui.addControl(arrowContainer);

  const createArrow = (text) => {
  const btn = new Rectangle();
  btn.width = "80px";
  btn.height = "80px";

  // ✅ Transparent circular look
  btn.background = "rgba(255,255,255,0.08)";
  btn.color = "white";
  btn.thickness = 2;
  btn.cornerRadius = 30; // makes it a circle

  const label = new TextBlock();
  label.text = text;
  label.color = "white";
  label.fontSize = 28;

  label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

  btn.addControl(label);
  return btn;
};

  const up = createArrow("↑");
  const down = createArrow("↓");
  const left = createArrow("←");
  const right = createArrow("→");

  // Use vertical StackPanel for rows
  const rowContainer = new StackPanel();
  rowContainer.isVertical = true;
  rowContainer.height = "160px";
  rowContainer.width = "160px";

  // Top row: Up arrow (centered)
  const topRow = new StackPanel();
  topRow.isVertical = false;
  topRow.height = "50px";
  up.marginLeft = "55px"; // centers the arrow horizontally
  topRow.addControl(up);

  // Middle row: Left & Right arrows
  const middleRow = new StackPanel();
  middleRow.isVertical = false;
  middleRow.height = "50px";
  left.marginRight = "10px"; // spacing between arrows
  middleRow.addControl(left);
  middleRow.addControl(right);

  // Bottom row: Down arrow (centered)
  const bottomRow = new StackPanel();
  bottomRow.isVertical = false;
  bottomRow.height = "50px";
  down.marginLeft = "55px"; // centers the arrow horizontally
  bottomRow.addControl(down);

  // Add rows to container
  rowContainer.addControl(topRow);
  rowContainer.addControl(middleRow);
  rowContainer.addControl(bottomRow);
  arrowContainer.addControl(rowContainer);

  // ---------------- CAMERA MOVEMENT ----------------
  const speed = 0.03;
  let upHold = false,
      downHold = false,
      leftHold = false,
      rightHold = false;

  up.onPointerDownObservable.add(() => (upHold = true));
  up.onPointerUpObservable.add(() => (upHold = false));
  down.onPointerDownObservable.add(() => (downHold = true));
  down.onPointerUpObservable.add(() => (downHold = false));
  left.onPointerDownObservable.add(() => (leftHold = true));
  left.onPointerUpObservable.add(() => (leftHold = false));
  right.onPointerDownObservable.add(() => (rightHold = true));
  right.onPointerUpObservable.add(() => (rightHold = false));

  // Apply movement each frame
  scene.onBeforeRenderObservable.add(() => {
    const camState = scene.cameraControl;
    if (!camState) return;

    if (leftHold) camState.rotationY -= speed;
    if (rightHold) camState.rotationY += speed;
    if (upHold) camState.offsetY += 0.2;
    if (downHold) camState.offsetY -= 0.2;

    // Clamp offsetY to prevent extreme vertical movement
    camState.offsetY = Math.max(-3, Math.min(5, camState.offsetY));
  });
}

  // ================= KEYBOARD =================
  const keyDown = (e) => {
    const key = e.key.toLowerCase();

    if (key === "l") {
      player.controller.block();
      flashButton(blockBtn, "cyan");
    }

    if (key === "j") {
      player.controller.attack(false);
      applyDamage(10, false);
    }

    if (key === "k") {
      player.controller.attack(true);
      applyDamage(20, true);
    }
  };

  const keyUp = (e) => {
    if (e.key.toLowerCase() === "l") {
      player.controller.unblock();
    }
  };

  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  // ✅ Cleanup (but UI stays!)
  scene.onDisposeObservable.add(() => {
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
  });
}

// ================= BUTTON =================
function createButton(text, color, isMobile) {
  const btn = new Rectangle();

  btn.width = isMobile ? "140px" : "100px";
  btn.height = isMobile ? "90px" : "55px";
  btn.cornerRadius = 10;
  btn.color = color;
  btn.thickness = 2;

  // ✅ Better visibility
  btn.background = "rgba(0,0,0,0.7)";
  btn.alpha = 0.95;
  btn.zIndex = 1000;

  btn.isPointerBlocker = true;

  const label = new TextBlock();
  label.text = text;
  label.color = color;
  label.fontSize = isMobile ? 28 : 18;

  label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

  btn.addControl(label);

  return btn;
}
