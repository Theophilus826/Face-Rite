import { GameState } from "../scenes/GameState";

export function CreateCharacterController(
  scene,
  characterBox,           // Collision/logic box
  animGroups = [],        // Array of animations
  BABYLON,
  enableInput = false,
  enemyBox = null,        // Optional single enemy reference
  playBox = null          // Required for player/enemy movement/interaction
) {
  const { Vector3, ActionManager, ExecuteCodeAction } = BABYLON;
  const engine = scene.getEngine();

  // ================= STATE =================
  let state = "Idle";
  let isAttacking = false;
  let targetPosition = null;
  let onAttackHit = null;
  let isBlocking = false;

  const ATTACK_RANGE = 2;       // Distance at which attack triggers
  const SPEEDS = { walk: 1, run: 3 };

  // ================= INPUT (OPTIONAL) =================
  const inputMap = {};
  if (enableInput) {
    if (!scene.actionManager) scene.actionManager = new ActionManager(scene);

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = true;
      })
    );

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
      })
    );
  }

  // ================= ANIMATION HELPERS =================
  function playAnim(name, loop = true) {
    if (!animGroups.length) return;

    animGroups.forEach((anim) => {
      if (anim.name.toLowerCase().includes(name.toLowerCase())) {
        if (!anim.isPlaying) anim.start(loop);
      } else {
        if (anim.isPlaying) anim.stop();
      }
    });
  }

  playAnim("idle", true);

  // ================= MOVEMENT =================
  function moveTo(pos, run = true) {
    if (!pos || isAttacking || isBlocking) return;
    targetPosition = pos.clone();
    state = run ? "Running" : "Walking";
    playAnim(state === "Running" ? "run" : "walk", true);
  }

  function stop() {
    targetPosition = null;
    state = "Idle";
    playAnim("idle", true);
  }

  // ================= BLOCKING =================
  function block() {
    if (isAttacking || isBlocking) return;
    isBlocking = true;
    state = "Blocking";
    playAnim("guarding", true);
  }

  function unblock() {
    if (!isBlocking) return;
    isBlocking = false;
    state = "Idle";
    playAnim("idle", true);
  }

  // ================= DAMAGE =================
  function receiveDamage(amount, heavy = false) {
    if (isBlocking) {
      return heavy ? amount * 0.5 : amount * 0.3;
    }
    return amount;
  }

  // ================= ATTACK =================
  function attack(double = false) {
    if (GameState.isPaused() || isAttacking || isBlocking || !animGroups.length) return;

    stop();

    const name = double ? "double" : "attack";
    const anim = animGroups.find(a => a.name.toLowerCase().includes(name));
    if (!anim) {
      console.warn("Attack animation not found:", name);
      return;
    }

    isAttacking = true;
    state = "Attacking";

    animGroups.forEach(a => a.stop());
    anim.start(false);

    if (onAttackHit) {
      const durationMs = anim.getLength() * 1000;
      setTimeout(() => {
        if (!GameState.isPaused()) onAttackHit();
      }, durationMs * 0.5);
    }

    anim.onAnimationEndObservable.addOnce(() => {
      isAttacking = false;
      stop();
    });
  }

  function setAttackHitCallback(fn) {
    onAttackHit = fn;
  }

  if (!playBox) {
    console.warn("CreateCharacterController: playBox is null!");
  }

  // ================= UPDATE LOOP =================
  function update() {
    if (GameState.isPaused()) return;

    const delta = engine.getDeltaTime() / 1000;

    // ---------------- PLAYER MOVEMENT ----------------
    if (!enemyBox) {
      if (!targetPosition || isAttacking || isBlocking) return;

      const toTarget = targetPosition.subtract(characterBox.position);
      toTarget.y = 0;

      if (toTarget.length() < 0.3) {
        stop();
        return;
      }

      toTarget.normalize();
      const speed = state === "Running" ? SPEEDS.run : SPEEDS.walk;
      characterBox.position.addInPlace(toTarget.scale(speed * delta));

      if (characterBox.modelRoot) {
        characterBox.modelRoot.rotation.y = Math.atan2(toTarget.x, toTarget.z);
      }

      return;
    }

    // ---------------- ENEMY AI MOVEMENT ----------------
    if (!playBox || isAttacking || isBlocking) return;

    const toPlayer = playBox.position.subtract(characterBox.position);
    toPlayer.y = 0;

    if (toPlayer.length() > ATTACK_RANGE) {
      const direction = toPlayer.normalize();
      characterBox.position.addInPlace(direction.scale(SPEEDS.walk * delta));

      if (characterBox.modelRoot) {
        characterBox.modelRoot.rotation.y = Math.atan2(direction.x, direction.z);
      }

      playAnim("run", true);
    } else {
      stop();
    }
  }

  // ================= API =================
  return {
    moveTo,
    stop,
    attack,
    block,
    unblock,
    receiveDamage,
    update,
    setAttackHitCallback,
    getState: () => state,
    inputMap,
  };
}
