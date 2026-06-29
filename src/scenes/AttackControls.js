import { Vector3 } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  Rectangle,
  TextBlock,
  Control,
  StackPanel,
  Container,
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
  const mobileScale = isMobile
    ? Math.min(window.innerWidth, window.innerHeight) / 390
    : 1;

  // ================= ATTACK BUTTON CONTAINER =================
  let container;

  if (isMobile) {
    // Use Container for mobile to allow absolute positioning
    container = new Container();
    container.widthInPixels = 280;
    container.heightInPixels = 280;
  } else {
    // Use StackPanel for desktop
    container = new StackPanel();
    container.isVertical = false;
    container.width = "auto";
    container.height = "70px";
    container.spacing = 10;
  }

  container.horizontalAlignment = isMobile
    ? Control.HORIZONTAL_ALIGNMENT_RIGHT
    : Control.HORIZONTAL_ALIGNMENT_CENTER;

  container.verticalAlignment = isMobile
    ? Control.VERTICAL_ALIGNMENT_CENTER
    : Control.VERTICAL_ALIGNMENT_BOTTOM;

  container.paddingBottom = isMobile ? "20px" : "10px";
  container.paddingRight = isMobile ? "20px" : "0px";
  container.paddingTop = isMobile ? "0px" : "0px";
  container.paddingLeft = isMobile ? "0px" : "10px";

  container.zIndex = 1000;

  ui.addControl(container);

  // ================= BUTTONS =================
  const lightBtn = createButton("J\nLight", "orange", isMobile);
  const heavyBtn = createButton("K\nHeavy", "red", isMobile);
  const blockBtn = createButton("L\nBlock", "cyan", isMobile);

  if (isMobile) {
    // Circular layout for mobile using StackPanel positioning
    lightBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    lightBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    lightBtn.top = "10px";

    heavyBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    heavyBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    heavyBtn.left = "20px";
    heavyBtn.bottom = "20px";

    blockBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    blockBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    blockBtn.right = "20px";
    blockBtn.bottom = "20px";
  }

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

    // Find target enemy
    const targetEnemy = enemies.find((enemy) => enemy.currentHealth > 0);

    let moveTarget;
    if (targetEnemy) {
      // Move towards target enemy
      const directionToTarget = targetEnemy.enemyBox.position
        .subtract(player.characterBox.position)
        .normalize();

      // Apply player input to modulate movement towards target
      const inputDirection = new Vector3(directionX, 0, directionZ).normalize();

      // Blend target direction with input (70% target, 30% input for control)
      const blendedDirection = directionToTarget
        .scale(0.7)
        .add(inputDirection.scale(0.3))
        .normalize();

      moveTarget = player.characterBox.position
        .clone()
        .add(blendedDirection.scale(1.2));
    } else {
      // Fallback: move in direction if no target
      const direction = new Vector3(directionX, 0, directionZ);
      if (direction.lengthSquared() > 1) {
        direction.normalize();
      }

      moveTarget = player.characterBox.position
        .clone()
        .add(direction.scale(1.2));
    }

    player.controller.moveTo(moveTarget, true);
    isMoving = true;
  };

  if (isMobile && camera) {
    const isPortrait = window.innerHeight > window.innerWidth;

    // Responsive D-Pad size
    const dpadSize = Math.min(
      window.innerWidth * (isPortrait ? 0.36 : 0.24),
      170,
    );

    const buttonSize = dpadSize * 0.38;
    const offset = dpadSize * 0.32;

    // ================= D-PAD CONTAINER =================
    const arrowContainer = new Container();

    arrowContainer.width = `${dpadSize}px`;
    arrowContainer.height = `${dpadSize}px`;

    arrowContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    arrowContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

    // Keep away from screen edges
    arrowContainer.left = "20px";
    arrowContainer.top = isPortrait ? "-35px" : "-20px";

    arrowContainer.zIndex = 1000;
    arrowContainer.isPointerBlocker = true;

    ui.addControl(arrowContainer);

    // ================= CREATE BUTTON =================
    const createArrow = (text) => {
      const btn = new Rectangle();

      btn.width = `${buttonSize}px`;
      btn.height = `${buttonSize}px`;

      btn.background = "rgba(0,0,0,0.75)";
      btn.color = "#64C8FF";
      btn.thickness = 2;
      btn.cornerRadius = 14;
      btn.isPointerBlocker = true;

      const label = new TextBlock();
      label.text = text;
      label.color = "white";
      label.fontSize = buttonSize * 0.45;

      btn.addControl(label);

      return btn;
    };

    const up = createArrow("↑");
    const down = createArrow("↓");
    const left = createArrow("←");
    const right = createArrow("→");

    // ================= POSITION BUTTONS =================
    up.top = `${-offset}px`;

    down.top = `${offset}px`;

    left.left = `${-offset}px`;

    right.left = `${offset}px`;

    arrowContainer.addControl(up);
    arrowContainer.addControl(down);
    arrowContainer.addControl(left);
    arrowContainer.addControl(right);

    // ================= TOUCH EVENTS =================

    const bindMove = (button, direction) => {
      button.onPointerDownObservable.add(() => {
        moveState[direction] = true;
        updatePlayerMovement();
      });

      button.onPointerUpObservable.add(() => {
        moveState[direction] = false;
        updatePlayerMovement();
      });

      button.onPointerOutObservable.add(() => {
        moveState[direction] = false;
        updatePlayerMovement();
      });
    };

    bindMove(up, "up");
    bindMove(down, "down");
    bindMove(left, "left");
    bindMove(right, "right");
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

  btn.width = isMobile
    ? `${Math.max(80, Math.min(100, Math.round(window.innerWidth * 0.2)))}px`
    : "100px";
  btn.height = isMobile
    ? `${Math.max(70, Math.min(85, Math.round(window.innerHeight * 0.09)))}px`
    : "55px";
  btn.cornerRadius = 10;
  btn.color = color;
  btn.thickness = 2;

  // ✅ Better visibility
  btn.background = "rgba(0,0,0,0.85)";
  btn.alpha = 1;
  btn.zIndex = 1000;

  btn.isPointerBlocker = true;

  const label = new TextBlock();
  label.text = text;
  label.color = color;
  label.fontSize = isMobile
    ? Math.max(18, Math.min(22, Math.round(window.innerWidth * 0.045)))
    : 18;

  label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

  btn.addControl(label);

  return btn;
}
