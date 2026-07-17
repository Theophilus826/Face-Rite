import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { Bubble } from "./Bubble.js";


export class BubblePool {

    constructor(scene) {

        this.scene = scene;

        this.pool = [];

    }

    get(radius = 0.5, colorData = null) {

        let bubble;

        if (this.pool.length > 0) {

            bubble = this.pool.pop();

        }
        else {

            bubble = new Bubble(
                this.scene,
                { radius }
            );

        }

        bubble.radius = radius;

        if (colorData)
            bubble.setColor(colorData);

        bubble.mesh.scaling.setAll(
            radius / 0.5
        );

        bubble.mesh.setEnabled(true);

        bubble.isMoving = false;
        bubble.isAttached = false;
        bubble.isMarked = false;

        return bubble;

    }

    release(bubble) {

        bubble.stop();

        bubble.row = -1;
        bubble.col = -1;

        bubble.mesh.setEnabled(false);

        this.pool.push(bubble);

    }

    clear() {

        while (this.pool.length) {

            this.pool.pop().dispose();

        }

    }

}