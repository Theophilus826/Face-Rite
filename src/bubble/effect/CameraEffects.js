import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
export class CameraEffects {

    constructor(scene) {

        this.scene = scene;

    }

    shake(camera, amount = 0.08, duration = 180) {

        const original =
            camera.position.clone();

        const start =
            performance.now();

        this.scene.onBeforeRenderObservable.add(function shake(){

            const t =
                performance.now() - start;

            if(t > duration){

                camera.position.copyFrom(original);

                this.scene.onBeforeRenderObservable.removeCallback(shake);

                return;

            }

            camera.position.x =
                original.x +
                (Math.random()-0.5)*amount;

            camera.position.y =
                original.y +
                (Math.random()-0.5)*amount;

        }.bind(this));

    }

    flash(color = new BABYLON.Color4(1,1,1,0.15)){

        const layer =
            new BABYLON.Layer(
                "Flash",
                null,
                this.scene,
                true
            );

        layer.color = color;

        BABYLON.Animation.CreateAndStartAnimation(

            "Flash",

            layer,

            "alpha",

            60,

            8,

            1,

            0,

            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,

            undefined,

            ()=>layer.dispose()

        );

    }

}