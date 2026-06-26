import { Vector3 } from "@babylonjs/core";
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
    ui.useInvalidateRect = true;
    scene.__attackUI = ui;
  }

  // ✅ Prevent duplicate creation
  if (scene.__attackControlsCreated) return;
  scene.__attackControlsCreated = true;

  const isMobile = window.innerWidth < 768;
  const mobileScale = isMobile ? Math.min(window.innerWidth, window.innerHeight) / 390 : 1;

  // ================= ATTACK BUTTON CONTAINER =================
  const container = new StackPanel();
  container.isVertical = false;
  container.height = isMobile ? "90px" : "70px";

  container.horizontalAlignment = isMobile
    ? Control.HORIZONTAL_ALIGNMENT_RIGHT
    : Control.HORIZONTAL_ALIGNMENT_CENTER;

  container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  container.spacing = isMobile ? Math.max(8, Math.round(10 * mobileScale)) : 10;

  container.paddingBottom = isMobile ? "12px" : "10px";
  if (isMobile) {
    container.paddingRight = "10px";
    container.paddingLeft = "10px";
  }

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

  // ================= PLAYER MOVEMENT CONTROLS =================
  const moveState = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  let isMoving = false;

  const updatePlayerMovement = () => {
    const directionX = (moveState.right ? 1 : 0) - (moveState.left ? 1 : 0);
    const directionZ = (moveState.down ? 1 : 0) - (moveState.up ? 1 : 0);

    if (!directionX && !directionZ) {
      if (isMoving) {
        player.controller.stop();
        isMoving = false;
      }
      return;
    }

    const direction = new Vector3(directionX, 0, directionZ);
    if (direction.lengthSquared() > 1) {
      direction.normalize();
    }

    const moveTarget = player.characterBox.position.clone().add(
      direction.scale(1.2),
    );

    player.controller.moveTo(moveTarget, true);
    isMoving = true;
  };

  if (isMobile && camera) {
    const arrowContainer = new StackPanel();
    arrowContainer.width = "150px";
    arrowContainer.height = "150px";
    arrowContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    arrowContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    arrowContainer.paddingLeft = "8px";
    arrowContainer.paddingBottom = "84px";
    arrowContainer.zIndex = 1000;
    arrowContainer.alpha = 1;
    ui.addControl(arrowContainer);

    const createArrow = (text) => {
      const btn = new Rectangle();
      btn.width = `${Math.max(56, Math.min(70, Math.round(64 * mobileScale)))}px`;
      btn.height = `${Math.max(56, Math.min(70, Math.round(64 * mobileScale)))}px`;

      btn.background = "rgba(255,255,255,0.08)";
      btn.color = "white";
      btn.thickness = 2;
      btn.cornerRadius = 30;

      const label = new TextBlock();
      label.text = text;
      label.color = "white";
      label.fontSize = Math.max(18, Math.min(24, Math.round(22 * mobileScale)));

      label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

      btn.addControl(label);
      return btn;
    };

    const up = createArrow("↑");
    const down = createArrow("↓");
    const left = createArrow("←");
    const right = createArrow("→");

    const rowContainer = new StackPanel();
    rowContainer.isVertical = true;
    rowContainer.height = "140px";
    rowContainer.width = "140px";

    const topRow = new StackPanel();
    topRow.isVertical = false;
    topRow.height = "42px";
    up.marginLeft = "40px";
    topRow.addControl(up);

    const middleRow = new StackPanel();
    middleRow.isVertical = false;
    middleRow.height = "42px";
    left.marginRight = "6px";
    middleRow.addControl(left);
    middleRow.addControl(right);

    const bottomRow = new StackPanel();
    bottomRow.isVertical = false;
    bottomRow.height = "42px";
    down.marginLeft = "40px";
    bottomRow.addControl(down);

    rowContainer.addControl(topRow);
    rowContainer.addControl(middleRow);
    rowContainer.addControl(bottomRow);
    arrowContainer.addControl(rowContainer);

    up.onPointerDownObservable.add(() => (moveState.up = true));
    up.onPointerUpObservable.add(() => (moveState.up = false));
    down.onPointerDownObservable.add(() => (moveState.down = true));
    down.onPointerUpObservable.add(() => (moveState.down = false));
    left.onPointerDownObservable.add(() => (moveState.left = true));
    left.onPointerUpObservable.add(() => (moveState.left = false));
    right.onPointerDownObservable.add(() => (moveState.right = true));
    right.onPointerUpObservable.add(() => (moveState.right = false));
  }

  scene.onBeforeRenderObservable.add(updatePlayerMovement);

  // ================= KEYBOARD =================
  const keyDown = (e) => {
    const key = e.key.toLowerCase();

    if (["w", "arrowup"].includes(key)) {
      e.preventDefault();
      moveState.up = true;
    }

    if (["s", "arrowdown"].includes(key)) {
      e.preventDefault();
      moveState.down = true;
    }

    if (["a", "arrowleft"].includes(key)) {
      e.preventDefault();
      moveState.left = true;
    }

    if (["d", "arrowright"].includes(key)) {
      e.preventDefault();
      moveState.right = true;
    }

    updatePlayerMovement();

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
    const key = e.key.toLowerCase();

    if (["w", "arrowup"].includes(key)) {
      e.preventDefault();
      moveState.up = false;
    }

    if (["s", "arrowdown"].includes(key)) {
      e.preventDefault();
      moveState.down = false;
    }

    if (["a", "arrowleft"].includes(key)) {
      e.preventDefault();
      moveState.left = false;
    }

    if (["d", "arrowright"].includes(key)) {
      e.preventDefault();
      moveState.right = false;
    }

    updatePlayerMovement();

    if (key === "l") {
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

  btn.width = isMobile ? `${Math.max(70, Math.min(92, Math.round(window.innerWidth * 0.18)))}px` : "100px";
  btn.height = isMobile ? `${Math.max(54, Math.min(70, Math.round(window.innerHeight * 0.08)))}px` : "55px";
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
  label.fontSize = isMobile ? Math.max(16, Math.min(20, Math.round(window.innerWidth * 0.04))) : 18;

  label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

  btn.addControl(label);

  return btn;
}
