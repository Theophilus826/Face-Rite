import "@babylonjs/loaders";

import { createHealthBar } from "../scenes/createHealthBar";
import { CreateCharacterController } from "../scenes/CreateCharacterController";
import { GameState } from "../scenes/GameState";

export async function CreatePlayer(scene, BABYLON) {
  const { MeshBuilder, Vector3 } = BABYLON;

  // --- LOAD MODEL ---
  const Model = await BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "/models/",
    "Fighters4.glb",
    scene
  );

  const anims = Model.animationGroups || [];

  // --- COLLISION BOX (ROOT) ---
  const characterBox = MeshBuilder.CreateBox(
    "playerBox",
    { width: 1, height: 2, depth: 1 },
    scene
  );

  characterBox.isVisible = false;
  characterBox.position.y = 1;

  // --- PARENT MODEL TO BOX ---
  const modelRoot = Model.meshes[0];
  Model.meshes.forEach((mesh) => {
    if (mesh !== characterBox) {
      mesh.setParent(characterBox);
    }
  });

  if (modelRoot) {
    modelRoot.rotation.x = Math.PI;
    modelRoot.position.y = -1; // adjust to match box center
    modelRoot.scaling.set(1.5, 1.5, 1.5);
  }

  // --- CONTROLLER ---
  const controller = CreateCharacterController(scene, characterBox, anims, BABYLON);

  // --- CREATE HEALTH BAR ---
  const healthUI = createHealthBar(scene, characterBox, modelRoot, {
    width: "120px",
    height: "15px",
    color: "green",
  });

  // --- SETUP HEALTH SYSTEM ---
  healthUI.setupHealth(200);

  // --- OVERRIDE takeDamage TO UPDATE UI AND HANDLE DEATH ---
  const originalTakeDamage = modelRoot.takeDamage || (() => {});
  modelRoot.takeDamage = (amount) => {
  originalTakeDamage(amount);
  healthUI.update();

  if (modelRoot.currentHealth <= 0) {
    modelRoot.currentHealth = 0;

    console.log("Player defeated");

    // 🛑 PAUSE GAME
    GameState.pause(scene);

    controller.stop();
    characterBox.setEnabled(false);
    healthUI.container.isVisible = false;

    // 🟥 SHOW GAME OVER
    
  }
};


  // --- PLAY ANIMATION FUNCTION ---
  function playAnim(name) {
    if (!anims.length) return;
    anims.forEach((anim) => {
      if (anim.name.toLowerCase() === name.toLowerCase()) {
        if (!anim.isPlaying) anim.start(true);
      } else if (anim.isPlaying) {
        anim.stop();
      }
    });
  }

  const attackAnim = anims.find((a) => a.name.toLowerCase().includes("attack"));

  return {
    characterBox,
    modelRoot,
    anims,
    controller,
    attackAnim,
    playAnim,
    healthUI, // contains container, healthBar, healthText, update, setupHealth
     takeDamage: modelRoot.takeDamage // <-- add this
  };
}
