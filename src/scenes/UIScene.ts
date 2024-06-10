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
  }

  registerEventListeners() {
    this.mainScene.events.on('test', () => {
      console.log('shooting');
    });
  }
}
