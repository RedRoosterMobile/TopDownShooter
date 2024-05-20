import { Game } from "./Game";

const BULLET_VELOCITY = 250 * 2;
const SHELL_VELOCITY = 150;
const SHOOTING_FREQUENCY = 200;
const weaponScreenshake = 0.00025;
const weaponKnockback = 50;

export default class Enemy {
  scene: Game;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  keys: object;
  targetAngle: number;
  public offset: number;
  public nextAngle: number;
  timerEvent: Phaser.Time.TimerEvent;
  legs: Phaser.GameObjects.Sprite;
  /**
   *
   * @param {Game} scene
   * @param {*} x
   * @param {*} y
   */
  constructor(scene: Game, x: number, y: number, wallLayer: Phaser.Tilemaps.TilemapLayer) {
    this.scene = scene;
    this.collisionLayer = wallLayer;
    this.legs = scene.add
      .sprite(x, y, "legs", "sprWaiterLegs_2.png").setScale(0.65)

    // Create the physics-based sprite that we will move around and animate
    this.sprite = scene.physics.add
      .sprite(x, y, "enemy", "enemy1.png")
      .setDrag(500, 500)
      .setOrigin(0.5, 0.5)
      .setMaxVelocity(300, 10000);
    const width = this.sprite.width;
    const newWidth = width * 0.35;
    const diff = width - newWidth;
    this.offset = diff / 4 + 0.5;
    this.sprite.setCircle(newWidth, this.offset, this.offset);

    this.scene.physics.world.addCollider(this.sprite, wallLayer);
    this.scene.physics.world.addCollider(this.sprite, this.scene.player.sprite);

    this.createAnimations();
  }

  createAnimations() {
    this.sprite.anims.create({
      key: "wiggle",
      frameRate: 10,
      frames: this.sprite.anims.generateFrameNames("enemy", {
        start: 1,
        end: 2,
        prefix: "enemy",
        suffix: ".png"
      }),
      repeat: -1
    });
    this.sprite.anims.create({
      key: "fly",
      frameRate: 10,
      frames: this.sprite.anims.generateFrameNames("enemy", {
        start: 3,
        end: 4,
        prefix: "enemy",
        suffix: ".png"
      }),
      repeat: -1
    });
    this.sprite.play('fly', true);
  }

  update(time: number, delta: number) {

    const sprite = this.sprite;


    // this.legs.play('walk', true);
    // this.legs.play('idle', true);

    this.legs.copyPosition(sprite);
    this.legs.setRotation(sprite.rotation);

  }


  destroy() {
    console.log('destroy enemy');
    //this.scene.events.destroy();
    this.legs.destroy();
    // this.sprite.anims.destroy();
    this.sprite.destroy();
  }
}


