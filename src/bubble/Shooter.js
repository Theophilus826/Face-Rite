import { Bubble } from "./Bubble.js";
import { randomColor } from "./Utils.js";
import { GameState } from "./GameState.js";

export class Shooter {
  constructor(
    scene,

    camera,

    canvas,

    board,

    pool = null,

    state = null,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this.board = board;

    this.pool = pool;
    this.state = state;

    // External systems
    this.collision = null;
    this.effects = null;
    this.matchFinder = null;
    this.game = null;
    this.launchPosition = new BABYLON.Vector3(0, -8.5, 0);

    this.radius = 0.5;
    this.speed = 10;

    this.direction = new BABYLON.Vector3(0, 1, 0);

    this.currentBubble = null;
    this.nextBubble = null;

    this.isMoving = false;

    this.createAimDots();
    this.createBubbles();
  }

  //--------------------------------------------------------------------------
  // Dependency Injection
  //--------------------------------------------------------------------------

  setCollision(collision) {
    this.collision = collision;
  }

  setEffects(effects) {
    this.effects = effects;
  }

  setMatchFinder(matchFinder) {
    this.matchFinder = matchFinder;
  }
  setGame(game) {
    this.game = game;
  }

  //--------------------------------------------------------------------------
  // Bubble Creation
  //--------------------------------------------------------------------------

  createBubbles() {
    this.currentBubble = new Bubble(this.scene, {
      radius: this.radius,
      color: randomColor(),
    });

    this.currentBubble.setPosition(
      this.launchPosition.x,
      this.launchPosition.y,
    );

    this.nextBubble = new Bubble(this.scene, {
      radius: this.radius,
    });

    this.nextBubble.setColor(randomColor());

    // Preview bubble
    this.nextBubble.mesh.scaling.setAll(0.8);

    this.nextBubble.setPosition(-1.2, -9.2);
  }

  loadNextBubble() {
    this.currentBubble = this.nextBubble;

    this.currentBubble.mesh.scaling.setAll(1);

    this.currentBubble.reset(this.launchPosition);

    this.nextBubble = new Bubble(this.scene, {
      radius: this.radius,
    });

    this.nextBubble.setColor(randomColor());

    this.nextBubble.mesh.scaling.setAll(0.8);

    this.nextBubble.setPosition(-1.2, -9.2);

    this.updateTrajectory();
  }

  //--------------------------------------------------------------------------
  // Aim
  //--------------------------------------------------------------------------

  createAimDots() {
    this.aimDots = [];

    for (let i = 0; i < 30; i++) {
      const size = 0.12 - i * 0.0025;

      const dot = BABYLON.MeshBuilder.CreateSphere(
        "AimDot",
        { diameter: size },
        this.scene,
      );

      const mat = new BABYLON.StandardMaterial("AimDotMaterial", this.scene);

      mat.disableLighting = true;
      mat.emissiveColor = BABYLON.Color3.White();
      mat.alpha = 1 - i * 0.03;

      dot.material = mat;
      dot.isPickable = false;

      this.aimDots.push(dot);
    }

    this.updateTrajectory();
  }

  updateAim(worldPoint) {
    const dir = worldPoint.subtract(this.launchPosition);

    if (dir.y < 0.05) {
      dir.y = 0.05;
    }

    let angle = Math.atan2(dir.y, dir.x);

    const min = BABYLON.Tools.ToRadians(20);
    const max = BABYLON.Tools.ToRadians(160);

    angle = BABYLON.Scalar.Clamp(angle, min, max);

    this.direction.set(Math.cos(angle), Math.sin(angle), 0);

    this.direction.normalize();

    this.updateTrajectory();
  }

  updateTrajectory() {
    let position = this.launchPosition.clone();
    let direction = this.direction.clone();

    const step = this.radius * 0.4;
    const maxSteps = 200;

    for (const dot of this.aimDots) {
      dot.setEnabled(false);
    }

    let dotIndex = 0;

    for (let i = 0; i < maxSteps && dotIndex < this.aimDots.length; i++) {
      position.addInPlace(direction.scale(step));

      //-----------------------------------
      // Left wall
      //-----------------------------------

      if (position.x <= this.board.leftWall) {
        position.x = this.board.leftWall;

        direction.x *= -1;
      }

      //-----------------------------------
      // Right wall
      //-----------------------------------

      if (position.x >= this.board.rightWall) {
        position.x = this.board.rightWall;

        direction.x *= -1;
      }

      //-----------------------------------
      // Ceiling
      //-----------------------------------

      if (position.y >= this.board.ceiling) {
        this.aimDots[dotIndex].position.copyFrom(position);
        this.aimDots[dotIndex].setEnabled(true);

        break;
      }

      //-----------------------------------
      // Collision with board
      //-----------------------------------

      if (this.willHitBubble(position)) {
        this.aimDots[dotIndex].position.copyFrom(position);
        this.aimDots[dotIndex].setEnabled(true);

        break;
      }

      //-----------------------------------
      // Draw every other step for smooth spacing
      //-----------------------------------

      if ((i & 1) === 0) {
        this.aimDots[dotIndex].position.copyFrom(position);
        this.aimDots[dotIndex].setEnabled(!this.isMoving);

        dotIndex++;
      }
    }
  }

  willHitBubble(position) {
    const cell = this.board.worldToGrid(position);

    const radius = 2;

    const hitDistance = this.board.radius * 2 - 0.08;

    const hitDistanceSq = hitDistance * hitDistance;

    for (let row = cell.row - radius; row <= cell.row + radius; row++) {
      for (let col = cell.col - radius; col <= cell.col + radius; col++) {
        const bubble = this.board.getBubble(row, col);

        if (!bubble || bubble.isFalling) continue;

        const dx = position.x - bubble.mesh.position.x;

        const dy = position.y - bubble.mesh.position.y;

        if (dx * dx + dy * dy <= hitDistanceSq) {
          return true;
        }
      }
    }

    return false;
  }

  //--------------------------------------------------------------------------
  // Shooting
  //--------------------------------------------------------------------------

  shoot() {
    if (this.isMoving) return;

    if (this.state) {
      this.state.set(GameState.PLAYING);
    }

    this.currentBubble.setVelocity(this.direction.scale(this.speed));

    this.isMoving = true;
  }

  update(delta) {
    // Update falling bubbles if the board implements an update method
    if (this.board && typeof this.board.update === "function") {
      this.board.update(delta);
    }

    if (!this.isMoving) return;

    this.currentBubble.move(delta);

    this.checkWalls();

    if (!this.collision) return;

    const result = this.collision.update(this.currentBubble) ?? { hit: false };

    if (result.hit) {
      this.attachBubble(result.row, result.col);
    }
  }

  checkWalls() {
    const pos = this.currentBubble.mesh.position;
    const vel = this.currentBubble.velocity;

    if (pos.x <= this.board.leftWall) {
      pos.x = this.board.leftWall;

      vel.x *= -1;
    }

    if (pos.x >= this.board.rightWall) {
      pos.x = this.board.rightWall;

      vel.x *= -1;
    }
  }

  //--------------------------------------------------------------------------
  // Attach Bubble
  //--------------------------------------------------------------------------

  attachBubble(row, col) {
    this.isMoving = false;
    this.currentBubble.stop();

    //------------------------------------------------------------
    // Attach bubble
    //------------------------------------------------------------
    this.board.addBubble(row, col, this.currentBubble);

    let popped = 0;
    let dropped = 0;

    //------------------------------------------------------------
    // Match detection
    //------------------------------------------------------------
    if (this.matchFinder) {
        const matches = this.matchFinder.find(row, col);

        if (matches.length >= 3) {

            if (this.effects) {
                this.effects.highlight(matches);
            }

            for (const bubble of matches) {

                const removed = this.board.removeBubble(
                    bubble.row,
                    bubble.col,
                    false
                );

                if (!removed) continue;

                popped++;

                if (this.effects) {
                    this.effects.particleBurst(
                        removed.mesh.position.clone(),
                        removed.color
                    );

                    this.effects.pop(removed);
                } else {
                    removed.dispose();
                }
            }

            //--------------------------------------------------------
            // Drop floating bubbles
            //--------------------------------------------------------

            const floating = this.matchFinder.findFloating();

            for (const bubble of floating) {
                dropped++;
                this.board.dropBubble(bubble);
            }
        }
    }

    //------------------------------------------------------------
    // Score
    //------------------------------------------------------------

    if (this.state) {

        if (popped >= 3) {
            this.state.addScore(popped * popped * 5);
        }

        if (dropped > 0) {
            this.state.addScore(dropped * 20);
        }
    }

    //------------------------------------------------------------
    // Advance board every N shots
    //------------------------------------------------------------

    if (this.game) {

        this.game.turnCounter++;

        if (this.game.turnCounter >= this.game.turnsBeforeShift) {

            this.game.turnCounter = 0;

            this.board.addRow();

            const dangerY = this.launchPosition.y + this.board.radius;

            if (this.board.isAtDangerLine(dangerY)) {

                this.game.gameOver();
                return;
            }
        }
    }

    //------------------------------------------------------------
    // Win
    //------------------------------------------------------------

    if (this.board.isEmptyBoard()) {

        if (this.state) {
            this.state.set(GameState.WIN);
        }

        return;
    }

    //------------------------------------------------------------
    // Next bubble
    //------------------------------------------------------------

    this.loadNextBubble();

    // Stay in PLAYING so timer keeps running.
}
}
