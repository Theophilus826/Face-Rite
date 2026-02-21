import {
  AdvancedDynamicTexture,
  Rectangle,
  TextBlock,
  Control,
} from "@babylonjs/gui";

/**
 * Sets up UI buttons + keyboard attacks
 * @param {BABYLON.Scene} scene
 * @param {object} player
 * @param {Array} enemies
 */
export function setupAttackControls(scene, player, enemies) {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

  const lightBtn = createButton(ui, "J\nLight", "orange", "-150px");
  const heavyBtn = createButton(ui, "K\nHeavy", "red", "-20px");
  const blockBtn = createButton(ui, "L\nBlock", "cyan", "110px");

  // ================= HELPER FUNCTIONS =================
  function getHitEnemy() {
    // Return the first enemy in range and alive
    return enemies.find(
      (enemy) =>
        enemy.currentHealth > 0 &&
        player.characterBox.intersectsMesh(enemy.enemyBox, false)
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

  const finalDamage =
    hitEnemy.characterController.receiveDamage(base, heavy);

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

  // ================= KEYBOARD EVENTS =================
  window.addEventListener("keydown", (e) => {
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
  });

  window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === "l") {
      player.controller.unblock();
    }
  });
}

// ================= BUTTON FACTORY =================
function createButton(ui, text, color, leftOffset) {
  const btn = new Rectangle();

  btn.width = "120px";
  btn.height = "50px";
  btn.cornerRadius = 8;
  btn.color = color;
  btn.thickness = 2;
  btn.background = "#222";

  btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  btn.top = "-20px";
  btn.left = leftOffset;
  btn.isPointerBlocker = true;

  ui.addControl(btn);

  const label = new TextBlock();
  label.text = text;
  label.color = color;
  label.fontSize = 18;
  label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

  btn.addControl(label);

  return btn;
}
