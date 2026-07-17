import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";

export class AnimationManager {

    constructor(scene) {
        this.scene = scene;
    }

    pop(bubble, onComplete = null) {

        const animation = new BABYLON.Animation(
            "BubblePop",
            "scaling",
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        animation.setKeys([
            {
                frame: 0,
                value: bubble.mesh.scaling.clone()
            },
            {
                frame: 4,
                value: bubble.mesh.scaling.scale(1.25)
            },
            {
                frame: 8,
                value: new BABYLON.Vector3(0.8, 1.3, 0.8)
            },
            {
                frame: 12,
                value: BABYLON.Vector3.Zero()
            }
        ]);

        bubble.mesh.animations = [animation];

        this.scene.beginAnimation(
            bubble.mesh,
            0,
            12,
            false,
            1,
            () => {
                bubble.dispose();

                if (onComplete)
                    onComplete(bubble);
            }
        );
    }

    spawn(bubble) {

        bubble.mesh.scaling.setAll(0);

        BABYLON.Animation.CreateAndStartAnimation(
            "Spawn",
            bubble.mesh,
            "scaling",
            60,
            12,
            BABYLON.Vector3.Zero(),
            BABYLON.Vector3.One(),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

    }

    highlight(bubbles) {

        for (const bubble of bubbles) {

            BABYLON.Animation.CreateAndStartAnimation(
                "Highlight",
                bubble.mesh,
                "scaling",
                60,
                8,
                BABYLON.Vector3.One(),
                new BABYLON.Vector3(1.15,1.15,1.15),
                BABYLON.Animation.ANIMATIONLOOPMODE_YOYO
            );

        }

    }

    land(bubble) {

        BABYLON.Animation.CreateAndStartAnimation(
            "Land",
            bubble.mesh,
            "scaling",
            60,
            8,
            new BABYLON.Vector3(1.2,0.85,1),
            BABYLON.Vector3.One(),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

    }

}