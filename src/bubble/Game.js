import * as GUI from "@babylonjs/gui";
import { socket } from "./socket.js";
import { useParams } from "react-router-dom";
import { Board } from "./Board.js";
import { Shooter } from "./Shooter.js";
import { Input } from "./Input.js";
import { Collision } from "./Collision.js";
import { MatchFinder } from "./MatchFinder.js";
import { Effects } from "./Effects.js";

import { StateManager, GameState } from "./GameState.js";
const { gameId } = useParams();
export class Game {
  constructor(engine, canvas, gameId) {
    this.engine = engine;
    this.canvas = canvas;

    this.scene = null;
    this.camera = null;

    // Game Systems
    this.board = null;
    this.shooter = null;
    this.input = null;
    this.collision = null;
    this.matchFinder = null;
    this.effects = null;
    this.turnCounter = 0;
    this.turnsBeforeShift = 3;
    // Session
    this.state = new StateManager({
      timeLimit: 180,
    });

    // GUI
    this.ui = null;
    this.scoreText = null;
    this.timerText = null;
    this.messageText = null;

    this.glow = null;
  }

  //==========================================================
  // Start
  //==========================================================

  start() {
    this.createScene();

    this.createSystems();

    this.createHUD();

    this.bindEvents();

    this.state.set(GameState.PLAYING);
  }

  //==========================================================
  // Systems
  //==========================================================

  createSystems() {
    this.board = new Board(this.scene);
    this.board.generate();

    this.effects = new Effects(this.scene);

    this.matchFinder = new MatchFinder(this.board);

    this.collision = new Collision(this.board);

    this.shooter = new Shooter(
      this.scene,
      this.camera,
      this.canvas,
      this.board,
      null,
      this.state,
    );

    this.shooter.setCollision(this.collision);
    this.shooter.setEffects(this.effects);
    this.shooter.setMatchFinder(this.matchFinder);
    this.shooter.setGame(this);

    this.input = new Input(this.scene, this.shooter);

    //------------------------------------------------------
    // Receive game configuration from backend
    //------------------------------------------------------

    socket.on("gameConfig", (config) => {
      if (typeof config.turnsBeforeShift === "number") {
        this.turnsBeforeShift = config.turnsBeforeShift;
      }

      if (typeof config.timeLimit === "number") {
        this.state.timeLimit = config.timeLimit;
        this.state.timeRemaining = config.timeLimit;
      }

      if (typeof config.targetScore === "number") {
        this.state.targetScore = config.targetScore;
      }

      if (typeof config.level === "number") {
        this.state.level = config.level;
      }
      console.log("Game Config:", config);
    });

    //------------------------------------------------------
    // Receive timer updates from backend
    //------------------------------------------------------

    socket.on("timer", (seconds) => {
      this.state.timeRemaining = seconds;
    });

    //------------------------------------------------------
    // Start game request
    //------------------------------------------------------

   socket.emit("joinGame", this.gameId); 
  }

  //==========================================================
  // Scene
  //==========================================================

  createScene() {
    this.scene = new BABYLON.Scene(this.engine);

    this.scene.clearColor = new BABYLON.Color4(0.08, 0.05, 0.12, 1);

    this.createCamera();

    this.createLights();

    this.createBackground();

    this.scene.environmentIntensity = 0.6;

    this.glow = new BABYLON.GlowLayer("Glow", this.scene);

    this.glow.intensity = 0.45;
  }

  createCamera() {
    this.camera = new BABYLON.FreeCamera(
      "Camera",

      new BABYLON.Vector3(0, 0, -20),

      this.scene,
    );

    this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

    this.updateCamera();

    this.camera.setTarget(BABYLON.Vector3.Zero());
  }

  updateCamera() {
    const ratio = this.engine.getRenderWidth() / this.engine.getRenderHeight();

    const size = 10;

    this.camera.orthoLeft = -size * ratio;
    this.camera.orthoRight = size * ratio;

    this.camera.orthoTop = size;
    this.camera.orthoBottom = -size;
  }

  createLights() {
    const hemi = new BABYLON.HemisphericLight(
      "Hemi",

      new BABYLON.Vector3(0, 1, 0),

      this.scene,
    );

    hemi.intensity = 0.8;

    hemi.diffuse = new BABYLON.Color3(0.8, 0.85, 1);

    const key = new BABYLON.DirectionalLight(
      "Key",

      new BABYLON.Vector3(0, -1, 0.2),

      this.scene,
    );

    key.position = new BABYLON.Vector3(0, 10, -10);

    key.intensity = 1.2;

    const fill = new BABYLON.DirectionalLight(
      "Fill",

      new BABYLON.Vector3(0, -1, -0.3),

      this.scene,
    );

    fill.intensity = 0.35;
  }

  createBackground() {
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "Background",

      {
        width: 22,

        height: 18,
      },

      this.scene,
    );

    plane.position.set(0, 0, 4);

    plane.rotation.y = Math.PI;

    plane.isPickable = false;

    const material = new BABYLON.StandardMaterial(
      "Background",

      this.scene,
    );

    material.diffuseColor = new BABYLON.Color3(0.05, 0.06, 0.12);

    material.emissiveColor = new BABYLON.Color3(0.04, 0.05, 0.09);

    material.specularColor = BABYLON.Color3.Black();

    plane.material = material;
  }

  //==========================================================
  // HUD
  //==========================================================

  createHUD() {
    this.ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      "HUD",

      true,

      this.scene,
    );

    this.scoreText = new GUI.TextBlock();

    this.scoreText.text = "Score : 0";

    this.scoreText.color = "white";

    this.scoreText.fontSize = 28;

    this.scoreText.top = "-46%";

    this.scoreText.left = "-40%";

    this.scoreText.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

    this.ui.addControl(this.scoreText);

    this.timerText = new GUI.TextBlock();

    this.timerText.text = "03:00";

    this.timerText.color = "white";

    this.timerText.fontSize = 28;

    this.timerText.top = "-46%";

    this.timerText.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

    this.ui.addControl(this.timerText);

    this.messageText = new GUI.TextBlock();

    this.messageText.fontSize = 72;

    this.messageText.color = "white";

    this.messageText.fontWeight = "bold";

    this.messageText.isVisible = false;

    this.ui.addControl(this.messageText);
  }

  bindEvents() {
    this.state.onChange((data) => {
      switch (data.state) {
        case GameState.GAME_OVER:
          this.messageText.text = `GAME OVER

Score: ${data.score}
Level: ${data.level}
Shots: ${data.shots}`;
          this.messageText.isVisible = true;
          break;

        case GameState.WIN:
          this.messageText.text = `YOU WIN!

Score: ${data.score}
Level: ${data.level}
Shots: ${data.shots}
Time Left: ${this.state.getTimeString()}`;
          this.messageText.isVisible = true;
          break;

        default:
          this.messageText.isVisible = false;
          break;
      }
    });
  }

  //==========================================================
  // Gameplay
  //==========================================================

  addScore(points) {
    this.state.addScore(points);

    // Check if the target score has been reached
    this.checkWin();
  }

  checkWin() {
    if (this.state.is(GameState.WIN)) return;

    if (this.state.score < this.state.targetScore) return;

    socket.emit("gameResult", {
      win: true,
      score: this.state.score,
      level: this.state.level,
      shots: this.state.shots,
      timeRemaining: this.state.timeRemaining,
    });

    this.state.set(GameState.WIN);
  }

  gameOver() {
    if (this.state.is(GameState.GAME_OVER)) return;

    socket.emit("gameResult", {
      win: false,
      score: this.state.score,
      level: this.state.level,
      shots: this.state.shots,
      timeRemaining: this.state.timeRemaining,
    });

    this.state.set(GameState.GAME_OVER);
  }

  restart() {
    this.board.clear();
    this.board.generate();

    this.turnCounter = 0;

    this.messageText.isVisible = false;

    this.state.reset();
    this.state.set(GameState.PLAYING);
  }

  //==========================================================
  // Update
  //==========================================================

  update(delta) {
    // Update HUD every frame
    this.scoreText.text = `Score : ${this.state.score} / ${this.state.targetScore}`;

    this.timerText.text = this.state.getTimeString();

    // Time over
    if (this.state.timeRemaining <= 0) {
      this.gameOver();
      return;
    }

    if (!this.state.is(GameState.PLAYING)) return;

    if (this.board) this.board.update(delta);

    if (this.shooter) this.shooter.update(delta);

    this.checkWin();
  }

  render() {
    if (!this.scene) return;

    const delta = this.engine.getDeltaTime() * 0.001;

    this.update(delta);

    this.scene.render();
  }

  resize() {
    this.updateCamera();
  }
}
