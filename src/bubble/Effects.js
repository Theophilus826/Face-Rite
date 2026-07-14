import { AnimationManager } from "./effect/AnimationManager.js";
import { ParticleManager } from "./effect/ParticleManager.js";
import { CameraEffects } from "./effect/CameraEffects.js";

export class Effects {

    constructor(scene) {

        this.scene = scene;

        this.animation = new AnimationManager(scene);
        this.particles = new ParticleManager(scene);
        this.camera = new CameraEffects(scene);

    }

    pop(bubble, callback) {
        this.animation.pop(bubble, callback);
    }

    spawn(bubble) {
        this.animation.spawn(bubble);
    }

    highlight(bubbles) {
        this.animation.highlight(bubbles);
    }

    land(bubble) {
        this.animation.land(bubble);
    }

    particleBurst(position, color) {
        this.particles.burst(position, color);
    }

    shakeCamera(camera, amount, duration) {
        this.camera.shake(camera, amount, duration);
    }

    flash(color) {
        this.camera.flash(color);
    }

}