import gameScene from "./gameScene.js"

let Scene = undefined
async function main (BABYLON, engine, currentScene){
 Scene = await gameScene(BABYLON, engine, currentScene)

 engine.runRenderLoop(() => {
  Scene.render();
 });
}

export default main