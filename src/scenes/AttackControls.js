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
    arrowContainer.width = "160px";
    arrowContainer.height = "160px";

    arrowContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    arrowContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

    arrowContainer.paddingLeft = "20px";
    arrowContainer.paddingBottom = "40px";
    arrowContainer.zIndex = 1000;

    ui.addControl(arrowContainer);

    const createArrow = (text) => {
      const btn = new Rectangle();
      btn.width = "50px";
      btn.height = "50px";
      btn.background = "rgba(0,0,0,0.6)";
      btn.color = "white";
      btn.thickness = 2;
      btn.cornerRadius = 8;

      const label = new TextBlock();
      label.text = text;
      label.color = "white";
      label.fontSize = 26;

      btn.addControl(label);
      return btn;
    };

    const up = createArrow("↑");
    const down = createArrow("↓");
    const left = createArrow("←");
    const right = createArrow("→");

    const row1 = new StackPanel();
    row1.isVertical = false;
    row1.addControl(new Rectangle());
    row1.addControl(up);
    row1.addControl(new Rectangle());

    const row2 = new StackPanel();
    row2.isVertical = false;
    row2.addControl(left);
    row2.addControl(new Rectangle());
    row2.addControl(right);

    const row3 = new StackPanel();
    row3.isVertical = false;
    row3.addControl(new Rectangle());
    row3.addControl(down);
    row3.addControl(new Rectangle());

    arrowContainer.addControl(row1);
    arrowContainer.addControl(row2);
    arrowContainer.addControl(row3);

    // ✅ CAMERA ONLY (does NOT touch player logic)
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

    scene.onBeforeRenderObservable.add(() => {
      const camState = scene.cameraControl;
      if (!camState) return;

      if (leftHold) camState.rotationY -= speed;
      if (rightHold) camState.rotationY += speed;
      if (upHold) camState.offsetY += 0.2;
      if (downHold) camState.offsetY -= 0.2;
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
