async function gameScene(
  BABYLON,
  engine,
  currentScene,
  progressCallback,
  dispatch,
  game,
  user
) {
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

  const isMobile = window.innerWidth < 768;

  // ---------------- FORCE LANDSCAPE (TS SAFE) ----------------
  if (isMobile && "orientation" in screen) {
    const orientation = screen.orientation as any;

    if (orientation?.lock) {
      orientation.lock("landscape").catch(() => {});
    }
  }

  // ✅ Fallback: trigger on user interaction (better support)
  const lockOnInteraction = () => {
    if ("orientation" in screen) {
      const orientation = screen.orientation as any;
      orientation?.lock?.("landscape").catch(() => {});
    }
    window.removeEventListener("click", lockOnInteraction);
  };
  window.addEventListener("click", lockOnInteraction);

  // ---------------- GAME MENU ----------------
  createGameMenu(scene, {
    onStart: () => {},
    onExit: () => engine.stopRenderLoop(),
  });

  // ---------------- LOADING ----------------
  let loaded = 0;
  const updateProgress = () =>
    progressCallback?.(Math.floor((loaded / 3) * 100));

  const { ground, playerTerritory, enemyPositions, ENEMY_TERRITORY_RADIUS } =
    await CreateEnvironment(scene, BABYLON);

  loaded++;
  updateProgress();

  ground.position.y = 0;
  ground.checkCollisions = true;

  // ---------------- CAMERA ----------------
  const camera = new FreeCamera(
    "camera",
    new Vector3(0, isMobile ? 7 : 5, isMobile ? -20 : -15),
    scene
  );

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

  // ---------------- ENEMIES ----------------
  scene.enemies = [];

  for (const pos of enemyPositions) {
    const enemy = await CreateEnemy(scene, BABYLON, pos, player.characterBox);

    enemy.enemyBox.checkCollisions = true;
    enemy.enemyBox.ellipsoid = new Vector3(0.5, 1.5, 0.5);
    enemy.currentHealth = 100;
    enemy.territoryRadius = ENEMY_TERRITORY_RADIUS;

    const ai = new EnemyController({ enemy, player, BABYLON });

    scene.enemies.push({ enemy, ai });
  }

  loaded++;
  updateProgress();

  // ---------------- UI CONTROLS ----------------
  setupAttackControls(
    scene,
    player,
    scene.enemies.map(({ enemy }) => enemy)
  );

  // ---------------- CAMERA FOLLOW ----------------
  const CAMERA_LERP = 0.08;

  scene.onBeforeRenderObservable.add(() => {
    if (!player?.characterBox || gameEnded || GameState.isPaused()) return;

    const target = player.characterBox.position;

    const desiredPosition = new Vector3(
      target.x,
      target.y + (isMobile ? 6 : 5),
      target.z + (isMobile ? -18 : -14)
    );

    camera.position = BABYLON.Vector3.Lerp(
      camera.position,
      desiredPosition,
      CAMERA_LERP
    );

    camera.setTarget(target);
  });

  // ---------------- PLAYER ATTACK CALLBACK ----------------
  player.controller.setAttackHitCallback(() => {
    scene.enemies.forEach(({ enemy }) => {
      if (enemy.currentHealth <= 0 || gameEnded) return;

      const dist = Vector3.Distance(
        player.characterBox.position,
        enemy.enemyBox.position
      );

      if (dist <= 2.5) {
        const damage =
          enemy.characterController.receiveDamage(10, false) ?? 10;
        enemy.takeDamage(damage);
      }
    });
  });

  // ---------------- KEYBOARD (ONLY PAUSE) ----------------
  const keyDownHandler = (e) => {
    if (gameEnded || GameState.isPaused()) return;

    const key = e.key.toLowerCase();

    if (key === "p" || key === "escape") {
      if (!GameState.isPaused()) {
        PauseMenu(scene, () => {}, restartGame, goToMainMenu);
      }
    }
  };

  window.addEventListener("keydown", keyDownHandler);

  // ---------------- POINTER ----------------
  scene.onPointerDown = (_, pickInfo) => {
    if (gameEnded || GameState.isPaused()) return;

    if (!pickInfo.hit || pickInfo.pickedMesh.name !== "ground") return;

    player.controller.moveTo(pickInfo.pickedPoint, true);
  };

  // ---------------- GAME LOOP ----------------
  scene.onBeforeRenderObservable.add(() => {
    if (gameEnded || GameState.isPaused()) return;

    player.controller?.update();

    scene.enemies.forEach(({ enemy, ai }) => {
      if (!ai) return;

      ai.update(performance.now() / 1000);

      const dist = BABYLON.Vector3.Distance(
        enemy.enemyBox.position,
        player.characterBox.position
      );

      if (
        dist <= 2.5 &&
        enemy.currentHealth > 0 &&
        player.currentHealth > 0
      ) {
        const dmg = player.controller.receiveDamage(5, false);
        player.takeDamage?.(dmg);
      }

      if (enemy.currentHealth <= 0) {
        ai.stop();
      }
    });

    if (
      scene.enemies.length > 0 &&
      scene.enemies.every(({ enemy }) => enemy.currentHealth <= 0)
    ) {
      endGame(user._id);
    }

    if (player.currentHealth <= 0 && !gameEnded) {
      player.controller.stop?.();
      endGame("AI");
    }
  });

  // ---------------- RESIZE ----------------
  const resizeHandler = () => engine.resize();
  window.addEventListener("resize", resizeHandler);

  // ---------------- CLEANUP ----------------
  await scene.whenReadyAsync();
  currentScene?.dispose();

  scene.onDisposeObservable.add(() => {
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("resize", resizeHandler);
    window.removeEventListener("click", lockOnInteraction); // ✅ cleanup
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
        dispatch
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