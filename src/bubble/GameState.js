import * as BABYLON from "@babylonjs/core";

export const GameState = {
  LOADING: 0,

  READY: 1,

  PLAYING: 2,

  PAUSED: 3,

  GAME_OVER: 4,

  WIN: 5,
};

export class StateManager {
  constructor(options = {}) {
    // ------------------------------------------------------------
    // State
    // ------------------------------------------------------------

    this.state = GameState.LOADING;
    this.previousState = null;

    // ------------------------------------------------------------
    // Game Session
    // ------------------------------------------------------------

    this.score = 0;
    this.targetScore = options.targetScore ?? Infinity;
    this.level = 1;

    this.shots = 0;

    this.timeLimit = options.timeLimit ?? 180;

    this.timeRemaining = this.timeLimit;

    // ------------------------------------------------------------
    // Events
    // ------------------------------------------------------------

    this.listeners = [];
  }

  //==============================================================
  // State
  //==============================================================

  set(state) {
    if (this.state === state) return;

    this.previousState = this.state;

    this.state = state;

    this.notify();
  }

  is(state) {
    return this.state === state;
  }

  was(state) {
    return this.previousState === state;
  }

  //==============================================================
  // Score
  //==============================================================

  addScore(points) {
    if (points <= 0) return;

    this.score += points;

    this.notify();
  }

  setScore(score) {
    this.score = Math.max(0, score);

    this.notify();
  }

  resetScore() {
    this.score = 0;

    this.notify();
  }

  //==============================================================
  // Timer
  //==============================================================

  update(delta) {
    if (this.state !== GameState.PLAYING) return;

    this.timeRemaining -= delta;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;

      this.set(GameState.GAME_OVER);

      return;
    }

    this.notify();
  }

  setTime(seconds) {
    this.timeRemaining = BABYLON.Scalar.Clamp(
      seconds,

      0,

      this.timeLimit,
    );

    this.notify();
  }

  addTime(seconds) {
    this.timeRemaining = Math.min(
      this.timeLimit,

      this.timeRemaining + seconds,
    );

    this.notify();
  }

  resetTimer() {
    this.timeRemaining = this.timeLimit;

    this.notify();
  }

  //==============================================================
  // Level
  //==============================================================

  nextLevel() {
    this.level++;

    this.notify();
  }

  resetLevel() {
    this.level = 1;

    this.notify();
  }

  //==============================================================
  // Shots
  //==============================================================

  addShot() {
    this.shots++;

    this.notify();
  }

  resetShots() {
    this.shots = 0;

    this.notify();
  }

  //==============================================================
  // Events
  //==============================================================

  onChange(callback) {
    if (typeof callback !== "function") return;

    this.listeners.push(callback);
  }

  offChange(callback) {
    const index = this.listeners.indexOf(callback);

    if (index !== -1) this.listeners.splice(index, 1);
  }

  notify() {
    const snapshot = {
      previousState: this.previousState,

      state: this.state,

      score: this.score,

      targetScore: this.targetScore,

      level: this.level,

      shots: this.shots,

      timeRemaining: this.timeRemaining,

      timeLimit: this.timeLimit,
    };

    for (const listener of this.listeners) listener(snapshot);
  }

  //==============================================================
  // Helpers
  //==============================================================

  getTimeString() {
    const total = Math.ceil(this.timeRemaining);

    const minutes = Math.floor(total / 60);

    const seconds = total % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  getName(state = this.state) {
    switch (state) {
      case GameState.LOADING:
        return "LOADING";

      case GameState.READY:
        return "READY";

      case GameState.PLAYING:
        return "PLAYING";

      case GameState.PAUSED:
        return "PAUSED";

      case GameState.GAME_OVER:
        return "GAME_OVER";

      case GameState.WIN:
        return "WIN";

      default:
        return "UNKNOWN";
    }
  }

  //==============================================================
  // Reset
  //==============================================================

  reset() {
    this.previousState = null;

    this.state = GameState.LOADING;

    this.score = 0;

    this.level = 1;

    this.shots = 0;

    this.timeRemaining = this.timeLimit;

    this.notify();
  }
}
