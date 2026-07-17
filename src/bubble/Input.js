import * as BABYLON from "@babylonjs/core";
export class Input {
  constructor(scene, shooter) {
    this.scene = scene;
    this.shooter = shooter;

    this.enabled = true;

    this.pointerObserver = null;
    this.keyboardObserver = null;

    this.rotationSpeed = 0.04;

    this.registerPointer();
    this.registerKeyboard();
  }

  //--------------------------------------------------------------------------
  // Pointer Input (Mouse + Touch)
  //--------------------------------------------------------------------------

  registerPointer() {
    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
      if (!this.enabled) return;

      if (this.shooter.isMoving) return;

      // Create a ray from the mouse position
      const ray = this.scene.createPickingRay(
        this.scene.pointerX,

        this.scene.pointerY,

        BABYLON.Matrix.Identity(),

        this.shooter.camera,
      );

      // Intersect with the game plane (z = 0)
      const t = -ray.origin.z / ray.direction.z;

      const worldPoint = ray.origin.add(ray.direction.scale(t));

      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERMOVE:
          this.shooter.updateAim(worldPoint);

          break;

        case BABYLON.PointerEventTypes.POINTERDOWN:
          this.shooter.updateAim(worldPoint);

          this.shooter.shoot();

          break;
      }
    });
  }

  //--------------------------------------------------------------------------
  // Keyboard Input
  //--------------------------------------------------------------------------

  registerKeyboard() {
    this.keyboardObserver = this.scene.onKeyboardObservable.add((kbInfo) => {
      if (!this.enabled) return;

      if (kbInfo.type !== BABYLON.KeyboardEventTypes.KEYDOWN) return;

      switch (kbInfo.event.code) {
        case "ArrowLeft":
        case "KeyA":
          this.rotateAim(-this.rotationSpeed);

          break;

        case "ArrowRight":
        case "KeyD":
          this.rotateAim(this.rotationSpeed);

          break;

        case "Space":
          if (!this.shooter.isMoving) this.shooter.shoot();

          break;
      }
    });
  }

  //--------------------------------------------------------------------------
  // Rotate Aim
  //--------------------------------------------------------------------------

  rotateAim(angle) {
    const dir = this.shooter.direction.clone();

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const x = dir.x * cos - dir.y * sin;
    const y = dir.x * sin + dir.y * cos;

    // Prevent aiming downward
    if (y <= 0.05) return;

    const point = this.shooter.launchPosition.add(
      new BABYLON.Vector3(x, y, 0).normalize().scale(10),
    );

    this.shooter.updateAim(point);
  }

  //--------------------------------------------------------------------------
  // Enable / Disable
  //--------------------------------------------------------------------------

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  //--------------------------------------------------------------------------
  // Cleanup
  //--------------------------------------------------------------------------

  dispose() {
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);

      this.pointerObserver = null;
    }

    if (this.keyboardObserver) {
      this.scene.onKeyboardObservable.remove(this.keyboardObserver);

      this.keyboardObserver = null;
    }
  }
}
