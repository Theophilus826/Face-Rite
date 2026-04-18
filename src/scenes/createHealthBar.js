import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";

/**
 * Creates a health bar that follows a mesh in world space
 */
export function createHealthBar(scene, mesh, target, options = {}) {
  const { width = "100px", height = "10px", color = "red" } = options;

  // One shared fullscreen UI
  let advancedTexture = scene._healthGUI;
  if (!advancedTexture) {
    advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
      "HealthUI",
      true,
      scene
    );
    scene._healthGUI = advancedTexture;
  }

  // Container
  const container = new Rectangle();
  container.width = width;
  container.height = height;
  container.thickness = 2;
  container.color = "white";
  container.background = "black";
  advancedTexture.addControl(container);

  // Health fill
  const healthBar = new Rectangle();
  healthBar.height = 1;
  healthBar.horizontalAlignment = Rectangle.HORIZONTAL_ALIGNMENT_LEFT;
  healthBar.background = color;
  container.addControl(healthBar);

  // Text
  const healthText = new TextBlock();
  healthText.color = "white";
  healthText.fontSize = 12;
  container.addControl(healthText);

  // Attach to mesh
  container.linkWithMesh(mesh);
  container.linkOffsetY =
    -mesh.getBoundingInfo().boundingBox.extendSize.y * 2;

  // --- HEALTH SETUP ---
  function setupHealth(maxHealth = 100) {
    target.maxHealth = maxHealth;
    target.currentHealth = maxHealth;

    target.takeDamage = (amount) => {
      target.currentHealth -= amount;
      if (target.currentHealth < 0) target.currentHealth = 0;
      update();
    };

    update();
  }

  // --- UI UPDATE ---
  function update() {
    if (!target.maxHealth) return;

    const percent = target.currentHealth / target.maxHealth;
    healthBar.width = `${percent * 100}%`;
    healthText.text = `${target.currentHealth} / ${target.maxHealth}`;
  }

  return {
    container,
    update,
    setupHealth,
  };
}
