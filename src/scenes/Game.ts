import { Scene } from 'phaser';
// @ts-ignore
import Player from './Player.js'

const PLAYER_SPAWN = "Spawn Point";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  playerGraphics: Phaser.GameObjects.Graphics;
  player: any;
  // msg_text: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);

    this.background = this.add.image(512, 384, 'background');
    this.background.setAlpha(0.5);

    // this.msg_text = this.add.text(512, 384, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
    //   fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
    //   stroke: '#000000', strokeThickness: 8,
    //   align: 'center'
    // });
    // this.msg_text.setOrigin(0.5);

    // this.input.once('pointerdown', () => {
    //   this.scene.start('GameOver');
    // });

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage(
      "CosmicLilac_Tiles",
      "tiles"
    );
    // @ts-ignore
    const mapFloor = map.createLayer("floor", tiles) //.setPipeline('Light2D');
    // @ts-ignore
    const mapWalls = map.createLayer("walls", tiles)//.setPipeline('Light2D');
    // @ts-ignore
    mapWalls.setCollisionByProperty({ collides: true });
    this.camera.setZoom(4)
    
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    const spawnPoint = map.findObject(
      "Objects",
      (obj) => obj.name === PLAYER_SPAWN
    );
    console.log(spawnPoint);
    // @ts-ignore
    this.player = new Player(this, spawnPoint.x, spawnPoint.y, mapWalls);
    this.cameras.main.startFollow(this.player.sprite, true, 0.05, 0.05);

   
    // @ts-ignore
    this.physics.world.addCollider(this.player.sprite, mapWalls);

    this.cameras.main.startFollow(this.player.sprite, true, 0.05, 0.05);

    
  }
  update(time: number, delta: number): void {
    this.player.update(time, delta);
  }
}
