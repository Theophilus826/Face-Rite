export class Collision {
  constructor(board) {
    this.board = board;

    this.hitDistance = board.radius * 2 - 0.08;
    this.hitDistanceSquared = this.hitDistance * this.hitDistance;

    // How many cells around the current position to search
    this.searchRadius = 2;
  }

  update(movingBubble) {
    const pos = movingBubble.mesh.position;

    //------------------------------------------------------
    // Ceiling
    //------------------------------------------------------

    if (pos.y >= this.board.ceiling) {
      const cell = this.board.worldToGrid(pos);

      return {
        hit: true,
        row: 0,
        col: BABYLON.Scalar.Clamp(cell.col, 0, this.board.cols - 1),
      };
    }

    //------------------------------------------------------
    // Search nearby cells only
    //------------------------------------------------------

    const center = this.board.worldToGrid(pos);

    let bestSnap = null;
    let bestScore = -1;
    let bestDistance = Number.MAX_VALUE;

    for (
      let row = center.row - this.searchRadius;
      row <= center.row + this.searchRadius;
      row++
    ) {
      if (row < 0 || row >= this.board.grid.length) continue;

      for (
        let col = center.col - this.searchRadius;
        col <= center.col + this.searchRadius;
        col++
      ) {
        if (col < 0 || col >= this.board.cols) continue;

        const bubble = this.board.getBubble(row, col);

        if (!bubble || bubble.isFalling) continue;

        const dx = pos.x - bubble.mesh.position.x;
        const dy = pos.y - bubble.mesh.position.y;

        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared > this.hitDistanceSquared) continue;

        const snap = this.findNearestEmptyCell(row, col, pos, movingBubble);

        if (!snap) continue;

        // Count same-color neighbours around this snap cell
        let score = 0;

        for (const neighbour of this.board.getNeighbors(snap.row, snap.col)) {
          if (neighbour.sameColor(movingBubble)) {
            score++;
          }
        }

        if (
          score > bestScore ||
          (score === bestScore && snap.distance < bestDistance)
        ) {
          bestScore = score;
          bestDistance = snap.distance;
          bestSnap = snap;
        }
      }
    }

    if (bestSnap) {
      return {
        hit: true,
        row: bestSnap.row,
        col: bestSnap.col,
      };
    }

    return { hit: false };
  }

  //------------------------------------------------------
  // Find best snap location
  //------------------------------------------------------

  findNearestEmptyCell(hitRow, hitCol, position, movingBubble) {

    let best = null;
    let bestScore = -1;
    let bestDistance = Number.MAX_VALUE;

    for (const cell of this.getNeighborCells(hitRow, hitCol)) {

        if (cell.row < 0) continue;

        if (cell.col < 0 || cell.col >= this.board.cols)
            continue;

        //--------------------------------------------------
        // Allow one new row below the board
        //--------------------------------------------------

        if (cell.row > this.board.grid.length)
            continue;

        if (
            cell.row < this.board.grid.length &&
            !this.board.isEmpty(cell.row, cell.col)
        ) {
            continue;
        }

        const world = this.board.gridToWorld(
            cell.row,
            cell.col
        );

        const dx = world.x - position.x;
        const dy = world.y - position.y;

        const distance = dx * dx + dy * dy;

        let score = 0;

        if (cell.row < this.board.grid.length) {

            for (const neighbor of this.board.getNeighbors(
                cell.row,
                cell.col
            )) {

                if (neighbor.sameColor(movingBubble)) {
                    score++;
                }
            }
        }

        if (
            score > bestScore ||
            (score === bestScore &&
                distance < bestDistance)
        ) {

            bestScore = score;
            bestDistance = distance;

            best = {
                row: cell.row,
                col: cell.col,
                distance
            };
        }
    }

    return best;
}

  //------------------------------------------------------
  // Hex neighbours
  //------------------------------------------------------

  getNeighborCells(row, col) {
    if ((row & 1) === 0) {
      return [
        { row: row - 1, col: col - 1 },
        { row: row - 1, col },

        { row, col: col - 1 },
        { row, col: col + 1 },

        { row: row + 1, col: col - 1 },
        { row: row + 1, col },
      ];
    }

    return [
      { row: row - 1, col },
      { row: row - 1, col: col + 1 },

      { row, col: col - 1 },
      { row, col: col + 1 },

      { row: row + 1, col },
      { row: row + 1, col: col + 1 },
    ];
  }
}
