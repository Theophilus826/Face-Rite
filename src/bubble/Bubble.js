import * as BABYLON from "@babylonjs/core";
import { randomColor } from "./Utils.js";
import { MaterialManager } from "./MaterialManager.js";

export class Bubble {

    static nextId = 0;

    constructor(scene, options = {}) {

        this.scene = scene;

        this.id = Bubble.nextId++;

        this.radius = options.radius ?? 0.5;

        this.colorData = options.color ?? randomColor();

        this.colorName = this.colorData.name;

        this.color = this.colorData.color.clone();

        this.row = options.row ?? -1;
        this.col = options.col ?? -1;

        // Movement
        this.velocity = BABYLON.Vector3.Zero();

        this.isMoving = false;
        this.isAttached = false;
        this.isMarked = false;
        this.isFalling = false;

        // Physics
        this.gravity = -18;
        this.maxFallSpeed = -15;

        this.createMesh();

    }

    //----------------------------------------------------------------------
    // Mesh
    //----------------------------------------------------------------------

    createMesh() {

        this.mesh = BABYLON.MeshBuilder.CreateSphere(

            "Bubble",

            {

                diameter: this.radius * 2,

                segments: 32

            },

            this.scene

        );

        this.mesh.material = MaterialManager.get(

            this.scene,

            this.colorData

        );

        this.mesh.receiveShadows = true;
        this.mesh.castShadow = true;
        this.mesh.isPickable = false;
        this.mesh.renderingGroupId = 1;

    }

    //----------------------------------------------------------------------
    // Position
    //----------------------------------------------------------------------

    setPosition(x, y) {

        this.mesh.position.set(x, y, 0);

    }

    //----------------------------------------------------------------------
    // Movement
    //----------------------------------------------------------------------

    move(delta) {

        if (!this.isMoving)
            return;

        if (this.isFalling) {

            this.velocity.y += this.gravity * delta;

            if (this.velocity.y < this.maxFallSpeed) {

                this.velocity.y = this.maxFallSpeed;

            }

        }

        this.mesh.position.addInPlace(

            this.velocity.scale(delta)

        );

    }

    setVelocity(vector) {

        this.velocity.copyFrom(vector);

        this.isMoving = true;

        this.isFalling = false;

    }

    startFalling() {

        this.row = -1;
        this.col = -1;

        this.isAttached = false;

        this.isMoving = true;

        this.isFalling = true;

        this.velocity.set(

            BABYLON.Scalar.RandomRange(-1.5, 1.5),

            -2,

            0

        );

        BABYLON.Animation.CreateAndStartAnimation(

            "BubbleSpin",

            this.mesh,

            "rotation.z",

            60,

            60,

            this.mesh.rotation.z,

            this.mesh.rotation.z + Math.PI * 4,

            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE

        );

    }

    stop() {

        this.velocity.set(0, 0, 0);

        this.isMoving = false;

        this.isFalling = false;

    }

    bounceX() {

        this.velocity.x *= -1;

    }

    //----------------------------------------------------------------------
    // Grid
    //----------------------------------------------------------------------

    setGridPosition(row, col) {

        this.row = row;
        this.col = col;

        this.stop();

        this.isAttached = true;

    }

    //----------------------------------------------------------------------
    // Color
    //----------------------------------------------------------------------

    setColor(colorData) {

        this.colorData = colorData;

        this.colorName = colorData.name;

        this.color = colorData.color.clone();

        this.mesh.material = MaterialManager.get(

            this.scene,

            colorData

        );

    }

    sameColor(other) {

        return other && this.colorName === other.colorName;

    }

    //----------------------------------------------------------------------
    // Visual
    //----------------------------------------------------------------------

    highlight(enable = true) {

        this.mesh.scaling.setAll(

            enable ? 1.15 : 1

        );

    }

    reset(position) {

        this.row = -1;
        this.col = -1;

        this.isAttached = false;
        this.isMarked = false;

        this.stop();

        this.mesh.rotation.set(0, 0, 0);

        this.mesh.scaling.setAll(1);

        this.mesh.visibility = 1;

        this.mesh.setEnabled(true);

        this.mesh.position.copyFrom(position);

    }

    pop(callback = null) {

        BABYLON.Animation.CreateAndStartAnimation(

            "BubblePop",

            this.mesh,

            "scaling",

            60,

            8,

            this.mesh.scaling.clone(),

            BABYLON.Vector3.Zero(),

            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,

            undefined,

            () => {

                this.mesh.setEnabled(false);

                if (callback)

                    callback(this);

            }

        );

    }

    //----------------------------------------------------------------------
    // Cleanup
    //----------------------------------------------------------------------

    dispose() {

        this.mesh.dispose();

    }

}