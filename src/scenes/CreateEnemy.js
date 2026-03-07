import "@babylonjs/loaders";

import { CreateCharacterController } from "../scenes/CreateCharacterController";
import { createHealthBar } from "../scenes/createHealthBar";

export async function CreateEnemy(
  scene,
  BABYLON,
  spawnPosition,
  playerBox = null
) {
  const { MeshBuilder, Vector3, SceneLoader } = BABYLON;

  // SAFETY
    if (!spawnPosition) {
    spawnPosition = Vector3.Zero();
  }
    // LOAD MODEL
  const enemyAsset = await SceneLoader.ImportMeshAsync(
    "",
    "/models/",
    "Spartarcus.glb",
    scene
  );

  const animGroups = enemyAsset.animationGroups || [];

  // COLLISION BOX (SOURCE OF TRUTH)
  const BOX_HEIGHT = 1.6;

  const enemyBox = MeshBuilder.CreateBox(
    "enemyBox",
    { width: 1, height: BOX_HEIGHT, depth: 1 },
    scene
  );

  enemyBox.isPickable = false;
  enemyBox.checkCollisions = true;
  enemyBox.ellipsoid = new Vector3(0.5, BOX_HEIGHT / 2, 0.5);
  enemyBox.position.copyFrom(spawnPosition);

  // VISUAL ROOT
  // Babylon glTF imports usually put the model under the first mesh
  const modelRoot = enemyAsset.meshes.find(m => m !== enemyBox);

  if (!modelRoot) {
    console.error("CreateEnemy: No model root found");
  } else {
    modelRoot.parent = enemyBox;

    // Reset local transform
    modelRoot.position.set(0, -BOX_HEIGHT / 2, 0);
    modelRoot.rotation.set(Math.PI, 0, 0);
    modelRoot.scaling.set(1, 1.5, 1);
  }

    // CHARACTER CONTROLLER
  const controller = CreateCharacterController(
    scene,
    enemyBox,
    animGroups,
    BABYLON,
    false,       // isPlayer
    enemyBox,    // self collider
    playerBox    // target collider
  );

  // AUTO-IDLE
    const idleAnim = animGroups.find(
    a =>
      a.name.toLowerCase().includes("idle") ||
      a.name.toLowerCase().includes("walk")
  );

  if (idleAnim) {
    idleAnim.start(true);
  }

  // ENEMY OBJECT
  const enemy = {
    enemyBox,
    modelRoot,
    animGroups,
    characterController: controller, 

    // Territory / AI anchor
    homePosition: enemyBox.position.clone(),

    spawnAt(position, faceTarget = null) {
      enemyBox.position.copyFrom(position);
      enemy.homePosition.copyFrom(position);

      if (faceTarget) {
        const dir = faceTarget.position.subtract(enemyBox.position);
        dir.y = 0;
        enemyBox.rotation.y = Math.atan2(dir.x, dir.z);
      }
    },

    updateFacing(target, turnSpeed = 0.15) {
      if (!target) return;

      const dir = target.position.subtract(enemyBox.position);
      dir.y = 0;

      const desiredYaw = Math.atan2(dir.x, dir.z);
      enemyBox.rotation.y +=
        (desiredYaw - enemyBox.rotation.y) * turnSpeed;
    }
  };

  // HEALTH SYSTEM
    const healthUI = createHealthBar(scene, enemyBox, enemy);
  healthUI.setupHealth(100);

  const originalTakeDamage = enemy.takeDamage;

  enemy.takeDamage = (amount) => {
  originalTakeDamage(amount);
  healthUI.update();

  if (enemy.currentHealth <= 0) {
    controller.stop();

    // 🧼 REMOVE HEALTH BAR
    healthUI.container.dispose();

    // 🧼 REMOVE MESHES
    enemyBox.dispose();
    if (modelRoot) modelRoot.dispose();
    
  }
};

  // ===============================
   enemyBox.isVisible = true;
  // enemyBox.visibility = 0.4;

  return enemy;
}
