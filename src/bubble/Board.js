import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { Bubble } from "./Bubble.js";
import { randomColor } from "./Utils.js";

export class Board {
  constructor(scene) {
    this.scene = scene;

    // Grid
    this.initialRows = 9;
    this.cols = 10;
    this.rowOffset = 12;
    this.displayRows = [];

    // Bubble size
    this.radius = 0.5;

    // Hex spacing
    this.xSpacing = this.radius * 2;
    this.ySpacing = Math.sqrt(3) * this.radius;

    // Top-left position
    this.startX = -4.5;
    this.startY = 7.5;

    this.grid = [];
    this.fallingBubbles = [];

    this.ui = null;
    this.rowLabels = [];
    this.rowLabelAnchors = [];
  }

  //=========================================================
  // Generate Board
  //=========================================================

  generate() {
    this.clear();

    this.grid = [];
    this.displayRows = [];

    //-------------------------------------------------
    // Create the initial board
    //-------------------------------------------------

    for (let row = 0; row < this.initialRows; row++) {
      this.grid[row] = [];
      this.displayRows[row] = this.getDisplayRow(row);

      for (let col = 0; col < this.cols; col++) {
        const bubble = new Bubble(this.scene, {
          radius: this.radius,
          color: randomColor(),
          row,
          col,
        });

        bubble.displayRow = this.displayRows[row];

        const pos = this.gridToWorld(row, col);

        bubble.setPosition(pos.x, pos.y);

        this.grid[row][col] = bubble;
      }
    }

    this.createRowLabels();
  }

  //=========================================================
  // Add Row
  //=========================================================

  addRow() {
    //-----------------------------------
    // Shift every existing bubble
    //-----------------------------------

    for (let row = this.grid.length - 1; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];

        if (!bubble) continue;

        bubble.row++;

        bubble.displayRow = this.getDisplayRow(bubble.row);

        const target = this.gridToWorld(bubble.row, bubble.col);

        BABYLON.Animation.CreateAndStartAnimation(
          "shiftX",
          bubble.mesh,
          "position.x",
          60,
          12,
          bubble.mesh.position.x,
          target.x,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        );

        BABYLON.Animation.CreateAndStartAnimation(
          "shiftY",
          bubble.mesh,
          "position.y",
          60,
          12,
          bubble.mesh.position.y,
          target.y,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        );
      }
    }

    //-----------------------------------
    // Insert new row at top
    //-----------------------------------

    const newRow = [];

    for (let col = 0; col < this.cols; col++) {
      const bubble = new Bubble(this.scene, {
        radius: this.radius,
        color: randomColor(),
        row: 0,
        col,
      });

      bubble.displayRow = this.getDisplayRow(0);

      const pos = this.gridToWorld(0, col);

      bubble.setPosition(pos.x, pos.y);

      newRow.push(bubble);
    }

    this.grid.unshift(newRow);

    //-----------------------------------
    // Fix row indices
    //-----------------------------------

    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];

        if (!bubble) continue;

        bubble.row = row;
      }
    }

    this.createRowLabels();
  }

  //=========================================================
  // Cleanup
  //=========================================================

  clear() {
    if (this.grid.length) {
      for (let row = 0; row < this.grid.length; row++) {
        if (!this.grid[row]) continue;

        for (let col = 0; col < this.cols; col++) {
          const bubble = this.grid[row][col];

          if (bubble) {
            bubble.dispose();
          }
        }
      }
    }

    for (const bubble of this.fallingBubbles) {
      bubble.dispose();
    }

    this.grid = [];
    this.fallingBubbles = [];

    for (const label of this.rowLabels) {
      label.dispose();
    }

    for (const anchor of this.rowLabelAnchors) {
      anchor.dispose();
    }

    this.rowLabels = [];
    this.rowLabelAnchors = [];
  }

  //=========================================================
  // Update
  //=========================================================

  update(delta) {
    this.fallingBubbles = this.fallingBubbles.filter((bubble) => {
      bubble.move(delta);

      if (bubble.mesh.position.y < this.bottomBoundary - 8) {
        bubble.dispose();
        return false;
      }

      return true;
    });
  }

  //=========================================================
  // Bubble Management
  //=========================================================

  addBubble(row, col, bubble) {
    if (!bubble) return;

    //-------------------------------------------------
    // Expand board if necessary
    //-------------------------------------------------

    while (this.grid.length <= row) {
      this.grid.push(new Array(this.cols).fill(null));

      this.displayRows.push(this.getDisplayRow(this.grid.length - 1));
    }

    const pos = this.gridToWorld(row, col);

    bubble.setGridPosition(row, col);
    bubble.setPosition(pos.x, pos.y);

    bubble.displayRow = this.getDisplayRow(row);

    bubble.isAttached = true;
    bubble.isFalling = false;

    this.grid[row][col] = bubble;
  }

  removeBubble(row, col, dispose = true) {
    const bubble = this.getBubble(row, col);

    if (!bubble) return null;

    this.grid[row][col] = null;

    bubble.isAttached = false;

    if (dispose) {
      bubble.dispose();
    }

    return bubble;
  }

  dropBubble(bubble) {
    if (!bubble || bubble.isFalling) return;

    // Remove from the board only if it is still attached
    if (
      bubble.row >= 0 &&
      bubble.col >= 0 &&
      this.grid[bubble.row]?.[bubble.col] === bubble
    ) {
      this.grid[bubble.row][bubble.col] = null;
    }

    bubble.startFalling();

    this.fallingBubbles.push(bubble);
  }

  //=========================================================
  // Queries
  //=========================================================

  getBubble(row, col) {
    if (row < 0) return null;
    if (row >= this.grid.length) return null;

    if (col < 0) return null;
    if (col >= this.cols) return null;

    return this.grid[row]?.[col] ?? null;
  }

  isEmpty(row, col) {
    return this.getBubble(row, col) === null;
  }

  isEmptyBoard() {
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row]?.[col]) {
          return false;
        }
      }
    }

    return true;
  }

  isAtDangerLine(yLimit) {
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];

        if (!bubble) continue;

        if (bubble.mesh.position.y <= yLimit) {
          return true;
        }
      }
    }

    return false;
  }
  //=========================================================
  // Coordinates
  //=========================================================

  gridToWorld(row, col) {
    const offset = row & 1 ? this.radius : 0;

    return {
      x: this.startX + col * this.xSpacing + offset,
      y: this.startY - row * this.ySpacing,
    };
  }

  worldToGrid(position) {
    let row = Math.round((this.startY - position.y) / this.ySpacing);

    //-------------------------------------------------
    // Never allow rows above the ceiling
    //-------------------------------------------------

    row = Math.max(0, row);

    //-------------------------------------------------
    // Allow one extra row below the board.
    // addBubble() will create it if needed.
    //-------------------------------------------------

    row = Math.min(row, this.grid.length);

    const offset = row & 1 ? this.radius : 0;

    let col = Math.round((position.x - this.startX - offset) / this.xSpacing);

    col = BABYLON.Scalar.Clamp(col, 0, this.cols - 1);

    return {
      row,
      col,
    };
  }

  //=========================================================
  // Hex Neighbours
  //=========================================================

  getNeighbors(row, col) {
    const odd = (row & 1) === 1;

    const offsets = odd
      ? [
          [1, 0],
          [1, 1],
          [0, -1],
          [0, 1],
          [-1, 0],
          [-1, 1],
        ]
      : [
          [1, -1],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [-1, 0],
        ];

    const neighbors = [];

    for (const [dr, dc] of offsets) {
      const r = row + dr;
      const c = col + dc;

      if (r < 0) continue;
      if (r >= this.grid.length) continue;

      if (c < 0 || c >= this.cols) continue;

      const bubble = this.grid[r][c];

      if (bubble && !bubble.isFalling) {
        neighbors.push(bubble);
      }
    }

    return neighbors;
  }

  //=========================================================
  // Debug Labels
  //=========================================================

  getDisplayRow(row) {
    return row + this.rowOffset;
  }

  createRowLabels() {
    if (!this.ui) {
      this.ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        "BoardUI",
        true,
        this.scene,
      );
    }

    //-------------------------------------------------
    // Remove old labels
    //-------------------------------------------------

    for (const label of this.rowLabels) {
      label.dispose();
    }

    for (const anchor of this.rowLabelAnchors) {
      anchor.dispose();
    }

    this.rowLabels = [];
    this.rowLabelAnchors = [];

    //-------------------------------------------------
    // Ensure displayRows matches current board size
    //-------------------------------------------------

    this.displayRows.length = this.grid.length;

    //-------------------------------------------------
    // Create labels
    //-------------------------------------------------

    for (let row = 0; row < this.grid.length; row++) {
      this.displayRows[row] = this.getDisplayRow(row);

      const anchor = new BABYLON.TransformNode(`RowLabel${row}`, this.scene);

      const pos = this.gridToWorld(row, this.cols - 1);

      anchor.position.set(this.rightWall + 1, pos.y, 0);

      const label = new GUI.TextBlock();

      label.text = String(this.displayRows[row]);
      label.color = "white";
      label.fontSize = 22;
      label.fontWeight = "bold";

      this.ui.addControl(label);
      label.linkWithMesh(anchor);

      this.rowLabels.push(label);
      this.rowLabelAnchors.push(anchor);
    }
  }

  //=========================================================
  // Bounds
  //=========================================================

  get leftWall() {
    return this.startX - this.radius;
  }

  get rightWall() {
    return this.startX + (this.cols - 1) * this.xSpacing + this.radius;
  }

  get ceiling() {
    return this.startY + this.radius;
  }

  get topBoundary() {
    return this.startY + this.radius * 2;
  }
}
