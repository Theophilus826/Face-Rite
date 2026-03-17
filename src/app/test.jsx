const { players, playersByUser, getOrCreatePlayer } = require("./gameState");

// ==========================
// GAME STATE STORE
// ==========================
const games = new Map();
// gameId => {
//   hostId,
//   enemiesConfigured,
//   numEnemies,
//   enemies: [],
//   pot,
//   status,
//   players,
//   playerBets,
//   startedAt
// }

// ==========================
// EMITTER HELPERS
// ==========================
const emitTacticalUpdate = (io) => {
  const data = [...playersByUser.values()]
    .filter((p) => p.room)
    .map((p) => ({
      userId: p.userId,
      username: p.username,
      position: p.position,
      health: p.health,
      room: p.room,
    }));

  io.emit("tacticalUpdate", { players: data });
};

const emitGameEvent = (io, adminNamespace, gameId, payload) => {
  if (!gameId) return;
  const event = { ...payload, gameId, timestamp: Date.now() };

  io.to(gameId).emit("game:event", event);
  adminNamespace.emit("game:event", event);
};

const emitActivity = (adminNamespace, payload) => {
  adminNamespace.emit("activity:event", {
    ...payload,
    timestamp: Date.now(),
  });
};

// ==========================
// GAME UTILS
// ==========================
const getOrInitGame = (gameId) => {
  if (!games.has(gameId)) {
    games.set(gameId, {
      hostId: null,
      enemiesConfigured: false,
      numEnemies: 0,
      enemies: [], // ✅ FULL ENEMY OBJECTS STORED HERE
      pot: 0,
      status: "waiting",
      players: [],
      playerBets: {},
      startedAt: null,
    });
  }
  return games.get(gameId);
};

const cleanupGameIfEmpty = (gameId) => {
  const stillHasPlayers = [...playersByUser.values()].some(
    (p) => p.room === gameId
  );
  if (!stillHasPlayers) games.delete(gameId);
};

// ==========================
// REGISTER SOCKETS
// ==========================
function registerGameSockets(io, adminNamespace, socket) {
  const player = getOrCreatePlayer(socket);

  if (player.socketId && player.socketId !== socket.id) {
    const oldSocket = io.sockets.sockets.get(player.socketId);
    oldSocket?.disconnect(true);
  }

  player.socketId = socket.id;
  players.set(socket.id, player);

  // ==========================
  // JOIN ROOM
  // ==========================
  socket.on("joinRoom", (gameId, callback) => {
    if (!gameId)
      return callback?.({ success: false, message: "Missing gameId" });

    socket.join(gameId);
    player.room = gameId;

    const game = getOrInitGame(gameId);

    if (!game.players.includes(player.userId))
      game.players.push(player.userId);

    if (!game.hostId)
      game.hostId = player.userId;

    // Sync if already started
    if (game.status === "started") {
      socket.emit("game:event", {
        type: "GAME_STARTED",
        gameId,
        pot: game.pot,
        enemies: game.enemies, // ✅ FULL ARRAY
        status: "started",
      });
    }

    emitGameEvent(io, adminNamespace, gameId, {
      type: "PLAYER_JOINED",
      userId: player.userId,
      username: player.username,
    });

    emitActivity(adminNamespace, {
      type: "PLAYER_JOINED",
      userId: player.userId,
      username: player.username,
      room: gameId,
    });

    emitTacticalUpdate(io);

    callback?.({
      success: true,
      joined: true,
      gameStatus: game.status,
      pot: game.pot,
      enemies: game.enemies, // ✅ FULL ARRAY
    });
  });

  // ==========================
  // INIT
  // ==========================
  socket.emit("init", {
    self: player,
    players: [...playersByUser.values()].filter(
      (p) => p.room === player.room
    ),
  });

  // ==========================
  // CREATE GAME / BET
  // ==========================
  socket.on("game:create", ({ gameId, hostId, betAmount }, callback) => {
    if (!gameId || !hostId || !betAmount || betAmount <= 0) {
      return callback?.({ success: false, message: "Invalid bet data" });
    }

    const game = getOrInitGame(gameId);

    game.hostId = hostId;
    game.playerBets[player.userId] = Number(betAmount);
    game.pot += Number(betAmount);

    emitGameEvent(io, adminNamespace, gameId, {
      type: "PLAYER_BET",
      userId: player.userId,
      username: player.username,
      betAmount: Number(betAmount),
      newPot: game.pot,
    });

    callback?.({ success: true, gameId, pot: game.pot });
  });

  // ==========================
  // CONFIGURE ENEMIES
  // ==========================
  socket.on("host:configureEnemies", ({ gameId, numEnemies }, callback) => {
    if (!gameId || !numEnemies || numEnemies <= 0) {
      return callback?.({ success: false, message: "Invalid enemy count" });
    }

    const game = getOrInitGame(gameId);
    const count = Number(numEnemies);
    const ENEMY_RADIUS = 12;

    const generatedEnemies = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;

      generatedEnemies.push({
        id: `enemy_${i}`,
        position: {
          x: Math.cos(angle) * ENEMY_RADIUS,
          y: 0,
          z: Math.sin(angle) * ENEMY_RADIUS,
        },
        health: 100,
      });
    }

    game.enemiesConfigured = true;
    game.numEnemies = count;
    game.enemies = generatedEnemies; // ✅ STORE FULL OBJECTS

    emitGameEvent(io, adminNamespace, gameId, {
      type: "ENEMIES_CONFIGURED",
      enemies: generatedEnemies,
    });

    emitActivity(adminNamespace, {
      type: "ENEMIES_CONFIGURED",
      gameId,
      enemies: count,
    });

    callback?.({ success: true, enemies: generatedEnemies });
  });

  // ==========================
  // ADD TO POT
  // ==========================
  socket.on("host:addToPot", ({ gameId, amount }, callback) => {
    if (!gameId || !amount || amount <= 0) {
      return callback?.({ success: false, message: "Invalid pot amount" });
    }

    const game = getOrInitGame(gameId);
    game.pot += Number(amount);

    emitGameEvent(io, adminNamespace, gameId, {
      type: "ADMIN_ADD_POT",
      amount,
      newPot: game.pot,
    });

    emitActivity(adminNamespace, {
      type: "ADMIN_ADD_POT",
      gameId,
      amount,
      newPot: game.pot,
    });

    callback?.({ success: true, newPot: game.pot });
  });

  // ==========================
  // START GAME
  // ==========================
  socket.on("host:startGame", ({ gameId }, callback) => {
    const game = getOrInitGame(gameId);

    if (!game.enemiesConfigured || game.enemies.length === 0) {
      return callback?.({
        success: false,
        message: "Enemies not configured",
      });
    }

    if (game.status === "started") {
      return callback?.({
        success: false,
        message: "Game already started",
      });
    }

    game.status = "started";
    game.startedAt = Date.now();

    emitGameEvent(io, adminNamespace, gameId, {
      type: "GAME_STARTED",
      pot: game.pot,
      enemies: game.enemies, // ✅ FULL ARRAY
      status: game.status,
    });

    callback?.({
      success: true,
      status: game.status,
      pot: game.pot,
      enemies: game.enemies, // ✅ FULL ARRAY
    });
  });

  // ==========================
  // DISCONNECT
  // ==========================
  socket.on("disconnect", () => {
    const p = players.get(socket.id);
    if (!p) return;

    players.delete(socket.id);

    if (p.room) {
      emitGameEvent(io, adminNamespace, p.room, {
        type: "PLAYER_DISCONNECTED",
        userId: p.userId,
        username: p.username,
      });

      emitActivity(adminNamespace, {
        type: "PLAYER_DISCONNECTED",
        userId: p.userId,
        room: p.room,
      });

      cleanupGameIfEmpty(p.room);
    }

    emitTacticalUpdate(io);
  });
}

module.exports = {
  registerGameSockets,
  games,
};

async function gameScene(
  BABYLON,
  engine,
  currentScene,
  progressCallback,
  dispatch,
  game,
  user
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

  const { Scene, Vector3, HemisphericLight, UniversalCamera } = BABYLON;

  // ---------------- ENGINE OPTIMIZATION ----------------
  if (window.innerWidth < 768) {
    engine.setHardwareScalingLevel(1.5);
  }

  const scene = new Scene(engine);

  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;
  scene.collisionsEnabled = true;
  scene.gravity = new Vector3(0, -0.5, 0);

  let gameEnded = false;

  // ---------------- PROGRESS ----------------
  let loaded = 0;
  const updateProgress = () =>
    progressCallback?.(Math.floor((loaded / 3) * 100));

  // ---------------- MENU (lazy) ----------------
  requestIdleCallback?.(() => {
    createGameMenu(scene, {
      onStart: () => {},
      onExit: () => engine.stopRenderLoop(),
    });
  });

  // ---------------- ENVIRONMENT ----------------
  const {
    ground,
    playerTerritory,
    enemyPositions,
    ENEMY_TERRITORY_RADIUS,
  } = await CreateEnvironment(scene, BABYLON);

  ground.position.y = 0;
  ground.checkCollisions = true;

  loaded++;
  updateProgress();

  // ---------------- CAMERA ----------------
  const camera = new UniversalCamera(
    "camera",
    new Vector3(0, 5, -15),
    scene
  );

  camera.attachControl(engine.getRenderingCanvas(), true);

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // ---------------- PLAYER ----------------
  const player = await CreatePlayer(scene, BABYLON);

  player.characterBox.modelRoot = player.modelRoot;
  player.characterBox.checkCollisions = true;
  player.characterBox.ellipsoid = new Vector3(0.5, 1.5, 0.5);
  player.characterBox.position = new Vector3(0, 1, 0);

  playerTerritory.parent = player.characterBox;

  scene.player = player;

  loaded++;
  updateProgress();

  // ---------------- ENEMIES (PARALLEL LOAD) ----------------
  scene.enemies = [];

  const enemyPromises = enemyPositions.map((pos) =>
    CreateEnemy(scene, BABYLON, pos, player.characterBox)
  );

  const enemies = await Promise.all(enemyPromises);

  enemies.forEach((enemy) => {
    enemy.enemyBox.checkCollisions = true;
    enemy.enemyBox.ellipsoid = new Vector3(0.5, 1.5, 0.5);
    enemy.currentHealth = 100;
    enemy.territoryRadius = ENEMY_TERRITORY_RADIUS;

    const ai = new EnemyController({
      enemy,
      player,
      BABYLON,
    });

    scene.enemies.push({ enemy, ai });
  });

  loaded++;
  updateProgress();

  // ---------------- CONTROLS ----------------
  setupAttackControls(
    scene,
    player,
    scene.enemies.map(({ enemy }) => enemy)
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
          enemy.characterController.receiveDamage(10, false) ?? 10;

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
    if (e.key.toLowerCase() === "l") {
      player.controller.unblock();
    }
  };

  window.addEventListener("keydown", keyDownHandler);
  window.addEventListener("keyup", keyUpHandler);

  // ---------------- POINTER ----------------
  scene.onPointerObservable.add((pointerInfo) => {
    if (
      pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN ||
      gameEnded ||
      GameState.isPaused()
    )
      return;

    const pick = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh.name === "ground"
    );

    if (pick?.hit) {
      player.controller.moveTo(pick.pickedPoint, true);
    }
  });

  // ---------------- GAME LOOP ----------------
  let lastAIUpdate = 0;

  scene.onBeforeRenderObservable.add(() => {
    if (gameEnded || GameState.isPaused()) return;

    player.controller?.update();

    const now = performance.now();

    if (now - lastAIUpdate > 120) {
      scene.enemies.forEach(({ enemy, ai }) => {
        ai.update(now / 1000);

        const dist = BABYLON.Vector3.Distance(
          enemy.enemyBox.position,
          player.characterBox.position
        );

        if (
          dist <= 2.5 &&
          enemy.currentHealth > 0 &&
          player.currentHealth > 0 &&
          !gameEnded
        ) {
          const dmg = player.controller.receiveDamage(5, false);
          player.takeDamage?.(dmg);
        }

        if (enemy.currentHealth <= 0) {
          ai.stop();
        }
      });

      lastAIUpdate = now;
    }

    // Win
    if (
      scene.enemies.length &&
      scene.enemies.every(({ enemy }) => enemy.currentHealth <= 0)
    ) {
      endGame(user._id);
    }

    // Lose
    if (player.currentHealth <= 0 && !gameEnded) {
      player.controller.stop?.();
      endGame("AI");
    }
  });

  // ---------------- FINALIZE ----------------
  await scene.whenReadyAsync();

  currentScene?.dispose();

  scene.onDisposeObservable.add(() => {
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);
  });

  return scene;

  // ---------------- END GAME ----------------
  async function endGame(winnerId) {
    if (gameEnded) return;

    gameEnded = true;

    try {
      dispatch(
        finishGame({
          gameId: game.id,
          winnerId,
        })
      );

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