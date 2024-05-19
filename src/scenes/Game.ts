import { Scene } from 'phaser';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
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
    this.camera.setScroll(-300, -250)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    var graphics = this.add.graphics({
      fillStyle: { color: 0xff0000 } // red color
    });
    var circle = new Phaser.Geom.Circle(this.camera.scrollX + Number(this.game.config.width) / 2, this.camera.scrollY + Number(this.game.config.height) / 2, 5); // x=100, y=200, radius=50

    graphics.fillCircleShape(circle);
    // this.groundLayer = map.createLayer("Ground", tiles).setPipeline("Light2D");
    // // this.groundLayer.postFX.addGradient(0x000000, 0x89739C, 0.88);
    // this.foreGround = map
    //   .createLayer("Foreground", tiles)
    //   .setScrollFactor(1.2)
    //   .setY(this.game.config.height * -0.1); //.setPipeline('Light2D');
  }
}
