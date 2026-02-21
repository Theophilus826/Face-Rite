import "@babylonjs/loaders";

export async function CreateEnvironment(scene, BABYLON, enemyCount = 3) {
  const {
    MeshBuilder,
    StandardMaterial,
    Texture,
    Vector3,
    Scalar,
    Color3,
    SceneLoader,
  } = BABYLON;

  // =========================
  // GROUND
  // =========================
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 100, height: 100 },
    scene
  );

  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.diffuseTexture = new Texture("/models/groundnormal.jpg", scene);
  groundMat.specularColor.set(0, 0, 0);
  ground.material = groundMat;
  ground.isPickable = true;

  // =========================
  // TERRITORIES
  // =========================
  const PLAYER_TERRITORY_RADIUS = 12;
  const ENEMY_TERRITORY_RADIUS = 10;

  const playerTerritory = MeshBuilder.CreateSphere(
    "playerTerritory",
    { diameter: PLAYER_TERRITORY_RADIUS * 2 },
    scene
  );

  const playerTerritoryMat = new StandardMaterial("playerTerritoryMat", scene);
  playerTerritoryMat.diffuseColor = new Color3(0, 0.5, 1);
  playerTerritoryMat.alpha = 0.15;
  playerTerritory.material = playerTerritoryMat;
  playerTerritory.isPickable = false;

  // =========================
  // SPAWN LOGIC
  // =========================
  const GROUND_SIZE = 100;
  const SAFE_MARGIN = 5;
  const MIN_DISTANCE_BETWEEN = 15; // min distance between player and enemies

  function randomInRange(min, max) {
    return Scalar.RandomRange(min, max);
  }

  function distanceXZ(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);
  }

  // Player spawn
  const playerSpawn = new Vector3(
    0,
    0.1,
    randomInRange(-GROUND_SIZE / 2 + SAFE_MARGIN, GROUND_SIZE / 2 - SAFE_MARGIN)
  );
  playerTerritory.position = playerSpawn;

  // Enemy spawn positions
  const enemyPositions = [];
  for (let i = 0; i < enemyCount; i++) {
    let spawn;
    let safe = false;
    while (!safe) {
      spawn = new Vector3(
        randomInRange(-GROUND_SIZE / 2 + SAFE_MARGIN, GROUND_SIZE / 2 - SAFE_MARGIN),
        0.1,
        randomInRange(-GROUND_SIZE / 2 + SAFE_MARGIN, GROUND_SIZE / 2 - SAFE_MARGIN)
      );
      safe = distanceXZ(spawn, playerSpawn) >= MIN_DISTANCE_BETWEEN &&
             enemyPositions.every((pos) => distanceXZ(spawn, pos) >= MIN_DISTANCE_BETWEEN);
    }
    enemyPositions.push(spawn);
  }

  // =========================
  // TREES (SAFE + FAST 🚀)
  // =========================
  try {
    console.log("Loading Tree.glb...");

    const treeAsset = await SceneLoader.ImportMeshAsync("", "/models/", "Tree.glb", scene);
    const treeMesh = treeAsset.meshes.find((m) => m.getTotalVertices && m.getTotalVertices() > 0);

    if (treeMesh) {
      treeMesh.setEnabled(false);

      const treeCount = 30;
      const spawnRadius = 50;

      for (let i = 0; i < treeCount; i++) {
        const instance = treeMesh.createInstance("tree_" + i);
        instance.position = new Vector3(
          Scalar.RandomRange(-spawnRadius, spawnRadius),
          0,
          Scalar.RandomRange(-spawnRadius, spawnRadius)
        );
        instance.scaling.setAll(1);
      }
    } else {
      console.warn("No valid tree mesh found in GLB");
    }
  } catch (err) {
    console.error("Tree.glb failed to load:", err);
  }

  // =========================
  // RETURN
  // =========================
  return {
    ground,
    playerTerritory,
    enemyPositions,
    PLAYER_TERRITORY_RADIUS,
    ENEMY_TERRITORY_RADIUS,
  };
}
