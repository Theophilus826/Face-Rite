// src/core/GameState.js

let paused = false;
let sceneRef = null;

export const GameState = {
  pause(scene) {
    if (paused) return;

    paused = true;
    sceneRef = scene;

    scene.animationRatio = 0;

    const physics = scene.getPhysicsEngine?.();
    if (physics) physics.setTimeStep(0);
  },

  resume() {
    if (!paused) return;

    paused = false;

    if (sceneRef) sceneRef.animationRatio = 1;

    const physics = sceneRef?.getPhysicsEngine?.();
    if (physics) physics.setTimeStep(1 / 60);

    sceneRef = null;
  },

  isPaused() {
    return paused;
  }
};
