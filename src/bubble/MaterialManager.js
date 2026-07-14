export class MaterialManager {

    static materials = new Map();

    static get(scene, colorData) {

        const key = colorData.name;

        if (this.materials.has(key))
            return this.materials.get(key);

        const material = new BABYLON.PBRMaterial(
            `Bubble_${key}`,
            scene
        );

        material.albedoColor.copyFrom(colorData.color);

        material.metallic = 0.1;
        material.roughness = 0.18;
        material.reflectivityColor = new BABYLON.Color3(0.4, 0.4, 0.4);

        material.clearCoat.isEnabled = true;
        material.clearCoat.intensity = 0.75;
        material.clearCoat.roughness = 0.2;

        material.subSurface.isTranslucencyEnabled = true;
        material.subSurface.diffusionDistance = new BABYLON.Color3(0.3, 0.3, 0.3);
        material.subSurface.tintColor = new BABYLON.Color3(1, 1, 1);

        material.environmentIntensity = 1.2;
        material.cameraExposure = 0.7;
        material.cameraContrast = 1.15;

        this.materials.set(
            key,
            material
        );

        return material;

    }

    static dispose() {

        for (const material of this.materials.values()) {

            material.dispose();

        }

        this.materials.clear();

    }

}