import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";

export const COLORS = {

    RED: {
        name: "red",
        color: new BABYLON.Color3(1.00, 0.15, 0.15)
    },

    BLUE: {
        name: "blue",
        color: new BABYLON.Color3(0.15, 0.75, 1.00)
    },

    GREEN: {
        name: "green",
        color: new BABYLON.Color3(0.20, 1.00, 0.20)
    },

    YELLOW: {
        name: "yellow",
        color: new BABYLON.Color3(1.00, 0.90, 0.10)
    },

    PURPLE: {
        name: "purple",
        color: new BABYLON.Color3(1.00, 0.20, 1.00)
    },

    ORANGE: {
        name: "orange",
        color: new BABYLON.Color3(1.00, 0.55, 0.10)
    }

};

export const COLOR_LIST = Object.freeze(
    Object.values(COLORS)
);

export function randomColor() {

    const index = Math.floor(
        Math.random() * COLOR_LIST.length
    );

    return COLOR_LIST[index];

}

export function getColor(name) {

    return COLOR_LIST.find(
        color => color.name === name
    ) ?? null;

}

export function getRandomColorName() {

    return randomColor().name;

}

export function cloneColor(colorData) {

    return {
        name: colorData.name,
        color: colorData.color.clone()
    };

}

export function isSameColor(a, b) {

    if (!a || !b)
        return false;

    return a.name === b.name;

}

export function getColorIndex(name) {

    return COLOR_LIST.findIndex(
        color => color.name === name
    );

}

export function colorCount() {

    return COLOR_LIST.length;

}

export function randomColorExcept(excludedName) {

    const choices = COLOR_LIST.filter(
        color => color.name !== excludedName
    );

    if (choices.length === 0)
        return randomColor();

    return choices[
        Math.floor(Math.random() * choices.length)
    ];

}