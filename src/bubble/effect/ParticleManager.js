import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";

export class ParticleManager {

    constructor(scene) {

        this.scene = scene;

    }

    burst(position, color) {

        const ps = new BABYLON.ParticleSystem(
            "Burst",
            50,
            this.scene
        );

        ps.particleTexture =
            new BABYLON.Texture(
                "textures/flare.png",
                this.scene
            );

        ps.emitter = position;

        ps.minEmitPower = 2;
        ps.maxEmitPower = 5;

        ps.minLifeTime = 0.25;
        ps.maxLifeTime = 0.6;

        ps.emitRate = 300;

        ps.color1 =
            new BABYLON.Color4(color.r,color.g,color.b,1);

        ps.color2 =
            new BABYLON.Color4(color.r,color.g,color.b,0.4);

        ps.manualEmitCount = 40;

        ps.disposeOnStop = true;

        ps.start();

        setTimeout(() => ps.stop(),200);

    }

}