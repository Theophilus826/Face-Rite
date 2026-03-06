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

  if (!spawnPosition) spawnPosition = Vector3.Zero();

  // ---------------- LOAD MODEL ----------------
  const enemyAsset = await SceneLoader.ImportMeshAsync(
    "",
    "/models/",
    "Spartarcus.glb",
    scene
  );

  const animGroups = enemyAsset.animationGroups || [];

  // ---------------- COLLISION BOX ----------------
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
  enemyBox.showBoundingBox = true;

  // ✅ scale the enemy safely
  enemyBox.scaling = new Vector3(0.45, 0.45, 0.45);

  // ---------------- PARENT MODEL ----------------
  enemyAsset.meshes.forEach((mesh) => {
    mesh.parent = enemyBox;
  });

  // find first visible mesh
  const visibleMesh = enemyAsset.meshes.find(
    (m) => m.getTotalVertices && m.getTotalVertices() > 0
  );

  // lift model so feet touch ground
  if (visibleMesh) {
    const bbox = visibleMesh.getBoundingInfo().boundingBox;
    const meshBottom = bbox.minimumWorld.y;

    visibleMesh.position.y = -meshBottom;
  }

  // ---------------- CHARACTER CONTROLLER ----------------
  const controller = CreateCharacterController(
    scene,
    enemyBox,
    animGroups,
    BABYLON,
    false,
    enemyBox,
    playerBox
  );

  // ---------------- IDLE ANIMATION ----------------
  const idleAnim = animGroups.find(
    (a) =>
      a.name.toLowerCase().includes("idle") ||
      a.name.toLowerCase().includes("walk")
  );

  idleAnim?.start(true);

  // ---------------- ENEMY OBJECT ----------------
  const enemy = {
    enemyBox,
    modelMeshes: enemyAsset.meshes,
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

      enemyBox.rotation.y +=
        (desiredYaw - enemyBox.rotation.y) * turnSpeed;
    },

    update(playerBox) {
      if (!playerBox) return;

      this.updateFacing(playerBox);
      this.characterController?.moveForward?.();
    },
  };

  // ---------------- HEALTH SYSTEM ----------------
  const healthUI = createHealthBar(scene, enemyBox, enemy);
  healthUI.setupHealth(enemy.currentHealth);

  enemy.takeDamage = (amount) => {
    enemy.currentHealth -= amount;

    if (enemy.currentHealth < 0) enemy.currentHealth = 0;

    healthUI.update();

    if (enemy.currentHealth <= 0) {
      controller.stop();

      healthUI.container.dispose();

      enemyAsset.meshes.forEach((m) => m.dispose());

      enemyBox.dispose();
    }
  };

  return enemy;
}
