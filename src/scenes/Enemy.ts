import { Vector2 } from "phaser3-rex-plugins/plugins/utils/geom/types";
import { C_SPATIAL_AUDIO } from "./Constants";
import { Game } from "./Game";
import { TilePainter } from "./classes/TilePainter";

const ENEMY_SPEED = 2;
const FLYING_COOLDOWN_MS = 1000;



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
  timeToNextGroan: number;
  id: number;
  floorLayer: Phaser.Tilemaps.TilemapLayer;

  magicCircle(magicScaler = 0.300) {
    const width = this.sprite.width;
    const newWidth = width * magicScaler;
    const diff = width - newWidth;
    this.offset = diff / 4 + (1 - magicScaler);
    this.sprite.setCircle(newWidth, this.offset, this.offset);
  }
  /**
   *
   * @param {Game} scene
   * @param {*} x
   * @param {*} y
   */
  constructor(scene: Game, x: number, y: number, wallLayer: Phaser.Tilemaps.TilemapLayer, floorLayer: Phaser.Tilemaps.TilemapLayer, id: number, radius: number) {
    this.scene = scene;
    this.collisionLayer = wallLayer;
    this.floorLayer = floorLayer
    this.isFlying = false;
    this.isGrabbing = false;
    this.isWalking = true;
    this.flyingCoolDownMs = FLYING_COOLDOWN_MS;
    this.tilePainter = new TilePainter(this.scene, "sprites");
    this.timeToNextGroan = 1000;
    this.id = id;

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
      .setFlipY(!!(this.id % 2))

    this.magicCircle();

    //this.sprite.body.center.set(this.sprite.body.center.x - this.sprite.width / 2, this.sprite.body.center.y - this.sprite.width / 2);
    //console.log(this.sprite.body.center);

    this.scene.physics.world.addCollider(this.sprite, wallLayer);
    this.scene.physics.world.addCollider(this.sprite, this.scene.player.sprite);
    this.scene.physics.world.addOverlap(this.sprite, floorLayer, (_, floor) => {
      //if (!this.isGrabbing) {
      this.lastFloorTile = floor;
      //console.log('erger');
      // @ts-ignore
      //console.log(floor.x,floor.y);
      //console.log(floorLayer.getTilesWithinWorldXY(this.sprite.body.position.x, this.sprite.body.position.y, 16, 16)[0]);

      //}
    });

    // TODO: other enemies
    // this.scene.physics.world.addCollider(this.sprite, this.scene.player.sprite);
    this.scene.enemies.forEach((_enemy) => {
      if (_enemy.id != this.id) {
        this.scene.physics.world.addCollider(this.sprite, _enemy.sprite)
      }
    })

    this.createAnimations();

    // works from here
    //this.scene.getEnemyDirection(this.sprite.body.position);
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

    // if distance to player is below 15 attach!
    const distToPlayer = Phaser.Math.Distance.Between(
      this.scene.player.sprite.x,
      this.scene.player.sprite.y,
      this.sprite.x,
      this.sprite.y
    );
    if (distToPlayer < 15) {
      // debatable..
      // this.isGrabbing = true;
    }



    // idea:
    // move this to player, so we can better check for other grabbers
    // and make the all grabbers rotate with the player
    // add a caontainer to he player? less hustle?
    // add them temporaily to the container    
    if (this.isGrabbing) {
      // attach the zombie to the player at a distance of 15
      //Phaser.Actions.PlaceOnCircle()
      Phaser.Actions.RotateAroundDistance(
        [this.sprite],
        { x: this.scene.player.sprite.x, y: this.scene.player.sprite.y },
        Phaser.Math.FloatBetween(0.1, 0.01),
        10
      );
      //Phaser.Actions.PlaceOnCircle([this.sprite], this.scene.player.grabCircle, this.id, this.id + 0.01)
      this.magicCircle(0.001);
      const direction = this.id % 2 ? -1 : 1;
      this.sprite.setPosition(this.sprite.x + Math.sin(time / 300) * 2 * direction, this.sprite.y + Math.cos(time / 300) * 2 * direction);

      //this.sprite.disableBody();
    }


    const normalSituation = true; // aka walking???
    if (normalSituation) {
      this.timeToNextGroan -= delta;
      if (this.timeToNextGroan <= 0) {
        // new random next groan
        const l = this.scene.enemies.length
        this.timeToNextGroan = Phaser.Math.Between(1000 * l, 2000 * l);
        // console.log(this.timeToNextGroan, 'GROOOOOAAN!' + this.id);

        // only do this if:
        // wait...

        this.scene.zombieSfx.play(
          Phaser.Math.Between(1, 11) + '', {
          rate: Phaser.Math.FloatBetween(0.7, 1),
          detune: Phaser.Math.FloatBetween(0, 50),
          source: {
            x: this.sprite.x,
            y: this.sprite.y,
            ...C_SPATIAL_AUDIO
          },
          loop: false
        });


        // this.scene.sound.play("zombie", {
        //   rate: Phaser.Math.FloatBetween(0.7, 1),
        //   detune: Phaser.Math.FloatBetween(0, 50),
        //   source: {
        //     x: this.sprite.x,
        //     y: this.sprite.y,
        //     ...C_SPATIAL_AUDIO
        //   }
        // });
      }

      if (!this.isWalking) {
        this.facePlayer();
      }

      // Calculate the velocity in the x and y directions
      if ((!this.isFlying || !this.isGrabbing)) {
        let speed = delta * Phaser.Math.FloatBetween(ENEMY_SPEED/2,ENEMY_SPEED) ; // Set the speed at which the sprite should move
        // let velocityX = Math.cos(rotation) * speed;
        // let velocityY = Math.sin(rotation) * speed;
        // // Set the velocity of the sprite
        // sprite.setVelocity(velocityX, velocityY);
        const path = this.scene.getEnemyDirection(this.sprite.body.position);

        if (path.length && path[1]) {
          // const targetGridPos = path[1] as Phaser.Math.Vector2;
          const tile = this.scene.mapFloor.getTileAt(path[1][0], path[1][1]);
          const targetPoint = new Phaser.Math.Vector2(tile.pixelX, tile.pixelY);
          const rotation = Phaser.Math.Angle.BetweenPoints(this.sprite.body.position, targetPoint);
          let velocityX = Math.cos(rotation) * speed;
          let velocityY = Math.sin(rotation) * speed;
          sprite.setRotation(rotation);
          // Set the velocity of the sprite
          sprite.setVelocity(velocityX, velocityY);
        } else {
          // face player and old way
          // const pointToHere = (this.scene.player.sprite as Phaser.GameObjects.Sprite);
          // let rotation = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, pointToHere.x, pointToHere.y);
          let rotation = Phaser.Math.Angle.BetweenPoints(this.sprite.body.position, this.scene.player.sprite.body.position);
          let velocityX = Math.cos(rotation) * speed;
          let velocityY = Math.sin(rotation) * speed;
          sprite.setRotation(rotation);
          // Set the velocity of the sprite
          sprite.setVelocity(velocityX, velocityY);
          //this.facePlayer();
        }
      }


      if (this.isGrabbing) {
        this.sprite.setAcceleration(0.0);
        this.sprite.play('wiggle', true);

        this.facePlayer();

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

  facePlayer() {
    const pointToHere = (this.scene.player.sprite as Phaser.GameObjects.Sprite);
    let rotation = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, pointToHere.x, pointToHere.y);
    this.sprite.setRotation(rotation);
  }

  startWalking() {
    if (!this.isGrabbing) {
      this.isGrabbing = false;
      this.isWalking = true;
      this.isFlying = false;
      if (this.sprite) {
        this.sprite.play('wiggle', true);
      }
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
    this.scene.player.attachedEnemies.push(this.id);
  }

  stopGrabbingPlayer() {
    //
    this.isGrabbing = false;
    this.isWalking = false;
    this.isFlying = false;

    if (this.sprite) {
      this.magicCircle();
      this.flyingCoolDownMs = FLYING_COOLDOWN_MS;
      //@ts-ignore
      this.lastFloorTile = null;
      //this.sprite.play('wiggle', true);

      // const rotation = this.sprite.rotation; // or any angle in radians
      // const accelerationMagnitude = -10000; // Set your desired acceleration magnitude
      // // Calculate the x and y components of the acceleration vector
      // const accelX = Math.cos(rotation) * accelerationMagnitude;
      // const accelY = Math.sin(rotation) * accelerationMagnitude;

      // // Set the acceleration of the sprite
      // this.sprite.setVelocity(accelX, accelY);
      const enemyDirection = this.sprite.body.velocity.clone().normalize();
      const magnitude = -Phaser.Math.Between(3000, 5000);
      //this.sprite.setAcceleration(enemyDirection.x * magnitude, enemyDirection.y * magnitude);


      let vector = new Phaser.Math.Vector2();
      vector.setToPolar(this.sprite.rotation, 1); // The second parameter is the radius. Set to 1 for a normalized vector
      this.sprite.setAcceleration(vector.x * magnitude, vector.y * magnitude);
      this.scene.time.delayedCall(300, () => {
        this.sprite.setAcceleration(0, 0).setVelocity(0, 0);
        const aTile = this.floorLayer.getTileAtWorldXY(this.sprite.x, this.sprite.y);
        console.log(aTile);
        if (!aTile) {
          console.log('offscreen... explode??');
          this.sprite.copyPosition(this.scene.player.sprite);
        }
        this.isWalking = true;
      })
    }
  }

  startFlyingTowardsPlayer() {
    if (this.isGrabbing) {
      return;
    }
    // FIXME:
    // weird, this needs to be here..
    // time for a state machine?
    this.isGrabbing = false;
    this.isWalking = false;
    this.isFlying = true;
    const distToPlayer = Phaser.Math.Distance.Between(
      this.scene.player.sprite.x,
      this.scene.player.sprite.y,
      this.sprite.x,
      this.sprite.y
    );

    if (this.flyingCoolDownMs <= 0 && distToPlayer < 50) {
      console.log('fly');
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
          console.log('start grabbing');
          this.startGrabbingPlayer();
        }
      })
      this.flyingCoolDownMs = FLYING_COOLDOWN_MS;
    } else {
      // this.startWalking();
    }
  }


  dieFromBullet(bulletVector: Phaser.Math.Vector2) {
    this.isDead = true;
    this.scene.sound.play("explodeBody", {
      rate: Phaser.Math.FloatBetween(0.7, 1),
      detune: Phaser.Math.FloatBetween(0, 50),
      source: {
        x: this.sprite.x,
        y: this.sprite.y,
        ...C_SPATIAL_AUDIO
      }
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
      this.sprite.play('die_bullet', Phaser.Math.FloatBetween(0, 1) > 0.75 ? true : false);
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


