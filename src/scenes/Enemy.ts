import { Game } from "./Game";
import { TilePainter } from "./classes/TilePainter";

const ENEMY_SPEED = 1;
const FLYING_COOLDOWN_MS = 1500;

export default class Enemy {
  scene: Game;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  keys: object;
  targetAngle: number;
  public offset: number;
  public nextAngle: number;
  timerEvent: Phaser.Time.TimerEvent;
  isFlying: boolean;
  isGrabbing: boolean;
  isWalking: boolean;
  flyingCoolDownMs: number;
  isDead: boolean;
  lastFloorTile: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody;
  tilePainter: TilePainter;
  /**
   *
   * @param {Game} scene
   * @param {*} x
   * @param {*} y
   */
  constructor(scene: Game, x: number, y: number, wallLayer: Phaser.Tilemaps.TilemapLayer, floorLayer: Phaser.Tilemaps.TilemapLayer) {
    this.scene = scene;
    this.collisionLayer = wallLayer;
    this.isFlying = false;
    this.isGrabbing = false;
    this.isWalking = true;
    this.flyingCoolDownMs = FLYING_COOLDOWN_MS;
    this.tilePainter = new TilePainter(this.scene, "sprites");

    const array = [0xaaaaaa, 0x99a9a9, 0x988888, 0x777777];
    //const array = [0x000000, 0x00ffff, 0x00ff00, 0xff0000];
    const randomTint = Phaser.Utils.Array.GetRandom(array);
    // Create the physics-based sprite that we will move around and animate
    this.sprite = scene.physics.add
      .sprite(x, y, "enemy", "enemy1.png")
      .setDrag(500, 500)
      .setOrigin(0.5, 0.5)
      .setMaxVelocity(300, 10000)
      .setScale(Phaser.Math.FloatBetween(1, 1.5))
      .setTint(randomTint)

    const width = this.sprite.width;
    const newWidth = width * 0.35;
    const diff = width - newWidth;
    this.offset = diff / 4 + 0.5;
    this.sprite.setCircle(newWidth, this.offset, this.offset);

    this.scene.physics.world.addCollider(this.sprite, wallLayer);
    this.scene.physics.world.addCollider(this.sprite, this.scene.player.sprite);
    this.scene.physics.world.addOverlap(this.sprite, floorLayer, (_, floor) => {
      this.lastFloorTile = floor;
    });

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
    this.sprite.anims.create({
      key: "die_bullet",
      frameRate: 15,
      frames: this.sprite.anims.generateFrameNames("enemy", {
        start: 5,
        end: 12,
        prefix: "enemy",
        suffix: ".png"
      }),
      repeat: 0
    });
    this.sprite.play('die_bullet', true);
  }

  update(time: number, delta: number) {
    if (this.isDead) {
      this.sprite.play('die_bullet', true);
      return;
    }
    const sprite = this.sprite;
    if (this.isFlying) {
      this.flyingCoolDownMs -= delta;
    }

    if (true) {
      const pointToHere = (this.scene.player.sprite as Phaser.GameObjects.Sprite);
      let rotation = Phaser.Math.Angle.Between(sprite.x, sprite.y, pointToHere.x, pointToHere.y);
      sprite.setRotation(rotation);
      let speed = delta * ENEMY_SPEED; // Set the speed at which the sprite should move
      // Calculate the velocity in the x and y directions
      let velocityX = Math.cos(rotation) * speed;
      let velocityY = Math.sin(rotation) * speed;
      if (!this.isFlying || !this.isGrabbing) {
        // Set the velocity of the sprite
        sprite.setVelocity(velocityX, velocityY);
      }


      if (this.isGrabbing) {
        this.sprite.setAcceleration(0.0);
        this.sprite.play('wiggle', true);


        // this.sprite.setVelocity(0, 0);

        // const delayFactor = 0.025;
        // // Calculate the new positions with delay
        // const newX = Phaser.Math.Linear(
        //   this.sprite.x,
        //   this.scene.player.sprite.x,
        //   delayFactor
        // );
        // const newY = Phaser.Math.Linear(
        //   this.sprite.y,
        //   this.scene.player.sprite.y,
        //   delayFactor
        // );
        // this.sprite.setPosition(newX, newY);
      }


    }

  }

  startWalking() {
    this.isGrabbing = false;
    this.isWalking = true;
    this.isFlying = false;
    if (this.sprite) {
      this.sprite.play('wiggle', true);
    }
  }

  startGrabbingPlayer() {
    //
    this.isGrabbing = true;
    this.isWalking = false;
    this.isFlying = false;
    if (this.sprite) {
      this.sprite.play('wiggle', true);
    }
  }

  startFlyingTowardsPlayer() {
    this.isGrabbing = false;
    this.isWalking = false;
    this.isFlying = true;

    if (this.flyingCoolDownMs <= 0) {
      this.sprite.play('fly', true);
      this.sprite.setVelocity(0, 0);

      this.scene.tweens.add({
        targets: this.sprite,
        x: this.scene.player.sprite.x,
        y: this.scene.player.sprite.y,
        ease: 'Power2',
        duration: 500,
        repeat: 0,
        onComplete: () => {
          // start grabbing
          this.startGrabbingPlayer();
        }
      })
      this.flyingCoolDownMs = FLYING_COOLDOWN_MS;
    }
  }


  dieFromBullet(bulletVector: Phaser.Math.Vector2) {
    this.isDead = true;

    this.scene.sound.play("explodeBody", {
      rate: Phaser.Math.FloatBetween(0.7, 1),
      detune: Phaser.Math.FloatBetween(0, 50)
    });
    this.tilePainter.paintTile(this.lastFloorTile as Phaser.Tilemaps.Tile);
    this.sprite.play('die_bullet', true);
    const randomSlowdown = Phaser.Math.FloatBetween(0.2, 1);
    this.sprite.body.velocity.x *= randomSlowdown;
    this.sprite.body.velocity.y *= randomSlowdown;
    const normalizedVector = bulletVector.normalize();

    const graphics = this.scene.add.graphics({
      lineStyle: { width: 5, color: 0xaa0000, alpha: 0.1 },
      fillStyle: { color: 0x00ff00, alpha: 0.1 }
    });
    graphics.beginPath();
    graphics.moveTo(this.sprite.x, this.sprite.y);
    let odds = 0;
    this.scene.time.addEvent
    const timerEvent = this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        graphics.lineTo(this.sprite.x + (odds % 2 ? -5 : 5), this.sprite.y + (odds % 2 ? -1 : 1)); odds++;
        //graphics.strokeCircle(this.sprite.x + (odds % 2 ? -5 : 5), this.sprite.y + (odds % 2 ? -5 : 5), 5);
      },
      loop: true
    });

    const emitter = this.scene.add.particles(0, 0, 'sprites', {
      // @ts-ignore
      frame: ['tile_blood_16_0.png', 'tile_blood_16_1.png', 'tile_blood_16_2.png', 'tile_blood_16_3.png'],

      //3 
      lifespan: 200,
      maxParticles: 5,
      speed: { min: 20, max: 35 },
      scale: { min: 0.5, max: 1 },
      rotate: { min: 0, max: 90 },
      gravityX: normalizedVector.x * 1000 * randomSlowdown,
      gravityY: normalizedVector.y * 1000 * randomSlowdown,

    }).setPosition(this.sprite.x, this.sprite.y);
    this.scene.time.delayedCall(200, () => {
      this.sprite.play('die_bullet', true);
      emitter.stop();
      graphics.lineTo(this.sprite.x + Phaser.Math.Between(-15, 15), this.sprite.y + Phaser.Math.Between(-1, 1));
      //graphics.strokeCircle(this.sprite.x + (odds % 2 ? -5 : 5), this.sprite.y + (odds % 2 ? -5 : 5), 5);
      graphics.closePath();
      graphics.strokePath();
      timerEvent.destroy();
      this.sprite.body.destroy();
      this.scene.time.delayedCall(500, () => {
        this.sprite.play('die_bullet', true);
        this.scene.time.delayedCall(500, () => {
          // all stuff to render texture
          this.scene.rt.draw(this.sprite, this.sprite.x, this.sprite.y);
          this.sprite.setVisible(false).destroy();
          this.scene.rt.draw(graphics);
          graphics.destroy();
        });

      })

      // TODO: blood sprite??
      //this.destroy();
    })

  }


  destroy() {
    console.log('destroy enemy');
    //this.scene.events.destroy();
    // this.legs.destroy();
    // this.sprite.anims.destroy();
    this.scene.tweens.killTweensOf(this.sprite);
    this.isGrabbing = false;
    this.isWalking = false;
    this.isFlying = false;
    this.sprite.destroy();
  }
}


