import Phaser from "phaser";
import { Game } from "./Game";

export class UIScene extends Phaser.Scene {
  mainScene: Game;

  constructor() {
    super({ key: "UIScene", active: true }); // Set active: true to run the scene in parallel
  }

  create() {
    this.mainScene = this.scene.manager.getScene("Game") as Game;
    this.registerEventListeners();
    // const graphics = this.add.graphics()
    // graphics.lineStyle(2, 0xff0000, 1); // Set line thickness, color and alpha
    // //graphics.fillStyle(2, 0xff0000);
    // graphics.fillStyle(0xff0000, 1); // Set the fill color to red and alpha to 1


    // // Draw background rectangle
    // graphics.fillRect(
    //   0,
    //   0,
    //   100,
    //   100
    // );
  }

  registerEventListeners() {
    this.mainScene.events.on('test', () => {
      console.log('shooting');
    });
  }
}
