import "@babylonjs/loaders";
import { CreateCharacterController } from "../scenes/CreateCharacterController";
import { createHealthBar } from "../scenes/createHealthBar";

let enemyModelCache = null;

export async function CreateEnemy(
  scene,
  BABYLON,
  spawnPosition,
  playerBox = null
) {
  const { MeshBuilder, Vector3, SceneLoader } = BABYLON;

  if (!spawnPosition) spawnPosition = Vector3.Zero();

  // ---------------- LOAD MODEL (CACHE) ----------------
  if (!enemyModelCache) {
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "/models/",
      "Spartarcus.glb",
      scene
    );

    enemyModelCache = {
      meshes: result.meshes,
      animGroups: result.animationGroups || []
    };

    // hide template meshes
    enemyModelCache.meshes.forEach((m) => m.setEnabled(false));
  }

  // ---------------- CLONE MODEL ----------------
  const meshes = enemyModelCache.meshes.map((m) => {
    const clone = m.clone("enemyClone");
    clone.setEnabled(true);
    return clone;
  });

  const animGroups = enemyModelCache.animGroups.map((a) =>
    a.clone("enemyAnim")
  );

  // fix animation targets
  animGroups.forEach((anim) => {
    anim.targetedAnimations.forEach((target) => {
      const clone = meshes.find((m) => m.name === target.target.name);
      if (clone) {
        target.target = clone;
      }
    });
  });

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

  // enemy scale
  enemyBox.scaling = new Vector3(0.45, 0.45, 0.45);

  // ---------------- PARENT MODEL ----------------
  meshes.forEach((mesh) => {
    mesh.parent = enemyBox;
  });

  // find first visible mesh
  const visibleMesh = meshes.find(
    (m) => m.getTotalVertices && m.getTotalVertices() > 0
  );

  // lift mesh so feet touch ground
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
    modelMeshes: meshes,
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

      meshes.forEach((m) => m.dispose());

      enemyBox.dispose();
    }
  };

  return enemy;
}
