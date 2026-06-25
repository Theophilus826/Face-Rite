import "@babylonjs/loaders";

import { CreateCharacterController } from "../scenes/CreateCharacterController";
import { createHealthBar } from "../scenes/createHealthBar";

export async function CreateEnemy(
scene,
BABYLON,
spawnPosition,
playerBox = null,
enemyId
) {
const {
MeshBuilder,
Vector3,
SceneLoader,
} = BABYLON;

/* =========================================================
SAFETY
========================================================= */
if (!spawnPosition) {
spawnPosition = Vector3.Zero();
}

/* =========================================================
LOAD MODEL
========================================================= */
const enemyAsset = await SceneLoader.ImportMeshAsync(
"",
"/models/",
"Spartarcus.glb",
scene
);

const animGroups = enemyAsset.animationGroups || [];

/* =========================================================
COLLISION BOX
========================================================= */
const BOX_HEIGHT = 1.6;

const enemyBox = MeshBuilder.CreateBox(
`enemyBox_${enemyId}`,
{
width: 1,
height: BOX_HEIGHT,
depth: 1,
},
scene
);

enemyBox.position.copyFrom(spawnPosition);
enemyBox.isPickable = false;
enemyBox.checkCollisions = true;

enemyBox.ellipsoid = new Vector3(
0.5,
BOX_HEIGHT / 2,
0.5
);

enemyBox.metadata = {
enemyId,
};

/* =========================================================
MODEL ROOT
========================================================= */
const modelRoot =
enemyAsset.meshes.find(
(mesh) => mesh !== enemyBox
) || null;

if (!modelRoot) {
console.error(`Enemy model missing for ${enemyId}`);
} else {
modelRoot.parent = enemyBox;


modelRoot.position.set(
  0,
  -BOX_HEIGHT / 2,
  0
);

modelRoot.rotation.set(
  Math.PI,
  0,
  0
);

modelRoot.scaling.set(
  1,
  1.5,
  1
);


}

/* =========================================================
CHARACTER CONTROLLER
========================================================= */
const controller = CreateCharacterController(
scene,
enemyBox,
animGroups,
BABYLON,
false,
enemyBox,
playerBox
);

/* =========================================================
START IDLE ANIMATION
========================================================= */
const idleAnim = animGroups.find(
(anim) =>
anim.name.toLowerCase().includes("idle") ||
anim.name.toLowerCase().includes("walk")
);

if (idleAnim) {
idleAnim.start(true);
}

/* =========================================================
ENEMY OBJECT
========================================================= */
const enemy = {
enemyId,


enemyBox,
modelRoot,

animGroups,

characterController: controller,

maxHealth: 100,
currentHealth: 100,

homePosition: enemyBox.position.clone(),

spawnAt(position, faceTarget = null) {
  enemyBox.position.copyFrom(position);
  this.homePosition.copyFrom(position);

  if (faceTarget) {
    const dir = faceTarget.position.subtract(
      enemyBox.position
    );

    dir.y = 0;

    enemyBox.rotation.y = Math.atan2(
      dir.x,
      dir.z
    );
  }
},

updateFacing(target, turnSpeed = 0.15) {
  if (!target) return;

  const dir = target.position.subtract(
    enemyBox.position
  );

  dir.y = 0;

  const desiredYaw = Math.atan2(
    dir.x,
    dir.z
  );

  enemyBox.rotation.y +=
    (desiredYaw - enemyBox.rotation.y) *
    turnSpeed;
},

takeDamage(amount = 10) {
  if (this.currentHealth <= 0) return;

  const damage =
    this.characterController?.receiveDamage(
      amount,
      false
    ) ?? amount;

  this.currentHealth = Math.max(
    0,
    this.currentHealth - damage
  );

  healthUI.update();

  if (this.currentHealth <= 0) {
    console.log(
      `Enemy Killed: ${this.enemyId}`
    );

    window.dispatchEvent(
      new CustomEvent("enemy:killed", {
        detail: {
          enemyId: this.enemyId,
        },
      })
    );

    controller?.stop?.();

    healthUI?.container?.dispose();

    enemyBox?.dispose();

    modelRoot?.dispose();
  }
},


};

/* =========================================================
HEALTH UI
========================================================= */
const healthUI = createHealthBar(
scene,
enemyBox,
enemy
);

healthUI.setupHealth(enemy.maxHealth);

/* =========================================================
DEBUG
========================================================= */
enemyBox.isVisible = false;
// enemyBox.visibility = 0.4;

return enemy;
}
