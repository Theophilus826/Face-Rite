async function gameScene(
  BABYLON,
  engine,
  currentScene,
  progressCallback,
  dispatch,
  game,
  user,
) {
  // ---------------- DYNAMIC IMPORTS ----------------
  const [
    { CreateEnvironment },
    { CreatePlayer },
    { CreateEnemy },
    { setupAttackControls },
    { createGameMenu },
    { PauseMenu },
    { GameState },
    { showEndScreen },
    { EnemyController },
    { finishGame },
  ] = await Promise.all([
    import("../scenes/CreateEnvironment"),
    import("../scenes/CreatePlayer"),
    import("../scenes/CreateEnemy"),
    import("../scenes/AttackControls"),
    import("../scenes/GameMenu"),
    import("../scenes/PauseMenu"),
    import("../scenes/GameState"),
    import("../scenes/showEndScreen"),
    import("../scenes/EnemyController"),
    import("../features/gameSlice/gameSlice"),
  ]);

  const { Scene, FreeCamera, Vector3, HemisphericLight } = BABYLON;

  const scene = new Scene(engine);
  let gameEnded = false;

  // ---------------- GAME MENU ----------------
  createGameMenu(scene, {
    onStart: () => {},
    onExit: () => engine.stopRenderLoop(),
  });

  // ---------------- LOADING ----------------
  let loaded = 0;
  const updateProgress = () =>
    progressCallback?.(Math.floor((loaded / 3) * 100));

  const { ground, playerTerritory, ENEMY_TERRITORY_RADIUS } =
    await CreateEnvironment(scene, BABYLON);

  loaded++;
  updateProgress();

  ground.position.y = 0;
  ground.checkCollisions = true;

  // ---------------- CAMERA ----------------
  const camera = new FreeCamera("camera", new Vector3(0, 5, -15), scene);

  camera.attachControl(engine.getRenderingCanvas(), true);

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // ---------------- PLAYER ----------------
  const player = await CreatePlayer(scene, BABYLON);

  loaded++;
  updateProgress();

  player.characterBox.modelRoot = player.modelRoot;
  player.characterBox.checkCollisions = true;
  player.characterBox.ellipsoid = new Vector3(0.5, 1.5, 0.5);
  player.characterBox.position = new Vector3(0, 1, 0);

  playerTerritory.parent = player.characterBox;

  scene.player = player;

 scene.enemies = [];

for (let enemyData of game.enemies) {
  const enemy = await CreateEnemy(
    scene,
    BABYLON,
    new Vector3(
      enemyData.position.x,
      enemyData.position.y,
      enemyData.position.z,
    ),
    player.characterBox,
  );

  enemy.enemyBox.checkCollisions = true;
  enemy.enemyBox.ellipsoid = new Vector3(0.5, 1.5, 0.5);

  enemy.currentHealth = 100;
  enemy.territoryRadius = ENEMY_TERRITORY_RADIUS;

  const ai = new EnemyController({
    enemy,
    player,
    BABYLON,
  });

  enemy.ai = ai;

  scene.enemies.push({
    enemy,
    controller: enemy.controller,
    ai
  });
}

  loaded++;
  updateProgress();

  // ---------------- CONTROLS ----------------
  setupAttackControls(
    scene,
    player,
    scene.enemies.map((e) => e.enemy),
  );

  player.controller.setAttackHitCallback(() => {

  scene.enemies.forEach(({ enemy }) => {

    if (enemy.currentHealth <= 0 || gameEnded) return;

    const dist = Vector3.Distance(
      player.characterBox.position,
      enemy.enemyBox.position
    );

    if (dist <= 2.5) {

      const damage =
        enemy.characterController.receiveDamage(10, false);

      enemy.takeDamage(damage);
    }
  });

});

  // ---------------- KEYBOARD ----------------
  const keyDownHandler = (e) => {
    if (gameEnded || GameState.isPaused()) return;

    const key = e.key.toLowerCase();

    if (key === "j") player.controller.attack(false);
    if (key === "k") player.controller.attack(true);
    if (key === "l") player.controller.block();

    if (key === "p" || key === "escape") {
      if (!GameState.isPaused()) {
        PauseMenu(scene, () => {}, restartGame, goToMainMenu);
      }
    }
  };

  const keyUpHandler = (e) => {
    if (e.key.toLowerCase() === "l") player.controller.unblock();
  };

  window.addEventListener("keydown", keyDownHandler);
  window.addEventListener("keyup", keyUpHandler);

  // ---------------- MOUSE ----------------
  scene.onPointerDown = (_, pickInfo) => {
    if (gameEnded || GameState.isPaused()) return;

    if (!pickInfo.hit || pickInfo.pickedMesh.name !== "ground") return;

    player.controller.moveTo(pickInfo.pickedPoint, true);
  };

  // ---------------- GAME LOOP ----------------
  scene.onBeforeRenderObservable.add(() => {
    if (gameEnded || GameState.isPaused()) return;

    player.controller?.update();

   scene.enemies.forEach(({ enemy }) => {

  enemy.ai.update(performance.now() / 1000);

  const dist = BABYLON.Vector3.Distance(
    enemy.enemyBox.position,
    player.characterBox.position
  );

  if (dist <= 2.5 && enemy.currentHealth > 0) {
    const dmg = player.controller.receiveDamage(5, false);
    player.takeDamage?.(dmg);
  }

  if (enemy.currentHealth <= 0) {
    enemy.ai.stop();
  }
});

   if (
  scene.enemies.length > 0 &&
  scene.enemies.every(({ enemy }) => enemy.currentHealth <= 0)
) {
  endGame(user._id);
}

    if (player.currentHealth <= 0) endGame("AI");
  });

  // ---------------- FINALIZE ----------------
  await scene.whenReadyAsync();
  currentScene?.dispose();

  scene.onDisposeObservable.add(() => {
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);
    scene.onPointerDown = null;
  });

  return scene;

  // ---------------- END GAME ----------------
  async function endGame(winnerId) {
    if (gameEnded) return;
    gameEnded = true;

    try {
      dispatch(finishGame({ gameId: game.id, winnerId }));

      showEndScreen(
        scene,
        winnerId === user._id ? "YOU WIN" : "GAME OVER",
        winnerId,
        goToMainMenu,
        game,
        user,
        dispatch,
      );
    } catch (err) {
      console.error("Game end error:", err);
    }
  }

  function restartGame() {
    engine.stopRenderLoop();
    location.reload();
  }

  function goToMainMenu() {
    engine.stopRenderLoop();
    currentScene?.dispose();
    location.reload();
  }
}

export default gameScene;
