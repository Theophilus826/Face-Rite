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

  // ------------------- DEFAULT POSITION -------------------
  if (!spawnPosition) {
    spawnPosition = Vector3.Zero();
  }

  // ------------------- LOAD GLTF MODEL -------------------
  const enemyAsset = await SceneLoader.ImportMeshAsync(
    "",
    "/models/",
    "Spartarcus.glb",
    scene
  );

  const animGroups = enemyAsset.animationGroups || [];

  // ------------------- COLLISION BOX -------------------
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
  enemyBox.isVisible = true;

  // ------------------- PARENT ALL VISIBLE MESHES -------------------
 const root = enemyAsset.meshes[0];

root.parent = enemyBox;
root.position = new Vector3(0, 0.8, 0);
root.scaling = new Vector3(1, 1, 1);
console.log("Enemy created:", enemy.enemyBox.position);
enemyBox.showBoundingBox = true;
console.log(enemyBox.position);
console.log(enemyAsset.meshes);
  // ------------------- CHARACTER CONTROLLER -------------------
  const controller = CreateCharacterController(
    scene,
    enemyBox,
    animGroups,
    BABYLON,
    false, // isPlayer
    enemyBox, // self collider
    playerBox // target collider
  );

  // ------------------- AUTO-IDLE ANIMATION -------------------
  const idleAnim = animGroups.find(
    (a) =>
      a.name.toLowerCase().includes("idle") ||
      a.name.toLowerCase().includes("walk")
  );
  if (idleAnim) {
    idleAnim.start(true);
  }

  // ------------------- ENEMY OBJECT -------------------
  const enemy = {
    enemyBox,
    modelMeshes,
    animGroups,
    characterController: controller,
    currentHealth: 100,
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
      enemyBox.rotation.y += (desiredYaw - enemyBox.rotation.y) * turnSpeed;
    },
  };

  // ------------------- HEALTH SYSTEM -------------------
  const healthUI = createHealthBar(scene, enemyBox, enemy);
  healthUI.setupHealth(enemy.currentHealth);

  enemy.takeDamage = (amount) => {
    enemy.currentHealth -= amount;
    if (enemy.currentHealth < 0) enemy.currentHealth = 0;

    healthUI.update();

    if (enemy.currentHealth <= 0) {
      // stop AI/controller
      controller.stop();

      // dispose health bar
      healthUI.container.dispose();

      // dispose enemy meshes
      enemyBox.dispose();
      modelMeshes.forEach((m) => m.dispose());
    }
  };

  return enemy;
}
