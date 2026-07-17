import * as BABYLON from "@babylonjs/core";
export class MatchFinder {
  constructor(board) {
    this.board = board;
  }

  //==============================================================
  // Public
  //==============================================================

  find(row, col) {
    const start = this.board.getBubble(row, col);

    if (!start) return [];

    return this.floodFill(
      [[row, col]],
      (bubble) => bubble.sameColor(start),
    );
  }

  findConnected(anchorRow = 0) {

    if (anchorRow >= this.board.grid.length) {
      return new Set();
    }

    const startCells = [];

    for (let col = 0; col < this.board.cols; col++) {

      if (this.board.getBubble(anchorRow, col)) {
        startCells.push([anchorRow, col]);
      }

    }

    const connected = this.floodFill(
      startCells,
      () => true,
    );

    return new Set(

      connected.map((bubble) =>
        this.makeKey(
          bubble.row,
          bubble.col,
        ),
      ),

    );
  }

  findFloating(anchorRow = 0) {

    const connected = this.findConnected(anchorRow);

    const floating = [];

    for (let row = 0; row < this.board.grid.length; row++) {

      for (let col = 0; col < this.board.cols; col++) {

        const bubble = this.board.getBubble(row, col);

        if (!bubble) continue;

        if (!connected.has(this.makeKey(row, col))) {
          floating.push(bubble);
        }

      }
    }

    return floating;
  }

  //==============================================================
  // Flood Fill
  //==============================================================

  floodFill(startCells, validator) {

    const result = [];
    const visited = new Set();

    const stack = [...startCells];

    while (stack.length) {

      const [row, col] = stack.pop();

      if (row < 0 || row >= this.board.grid.length) continue;
      if (col < 0 || col >= this.board.cols) continue;

      const key = this.makeKey(row, col);

      if (visited.has(key)) continue;

      visited.add(key);

      const bubble = this.board.getBubble(row, col);

      if (!bubble) continue;

      if (!validator(bubble)) continue;

      result.push(bubble);

      for (const neighbor of this.board.getNeighbors(row, col)) {

        if (!neighbor) continue;

        stack.push([
          neighbor.row,
          neighbor.col,
        ]);
      }
    }

    return result;
  }

  //==============================================================
  // Helpers
  //==============================================================

  makeKey(row, col) {
    return `${row}:${col}`;
  }
}