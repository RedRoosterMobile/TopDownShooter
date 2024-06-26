import { C_SPATIAL_AUDIO } from "./Constants";
import { Game } from "./Game";
import { TilePainter } from "./classes/TilePainter";

const ENEMY_SPEED = 3;
const FLYING_COOLDOWN_MS = 1000;



export default class Enemy {
  scene: Game;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  displaySprite: Phaser.GameObjects.Sprite;
  keys: object;
  targetAngle: number;
  public offset: number;
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
  spriteScale: number;
  t: number;
  visibilityTween: Phaser.Tweens.Tween;

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
    this.spriteScale = Phaser.Math.FloatBetween(1, 1.5);
    this.t = Phaser.Math.FloatBetween(0, ENEMY_SPEED);
    this.sprite = scene.physics.add
      .sprite(x, y, "enemy", "enemy1.png")
      .setDrag(500, 500)
      .setOrigin(0.5, 0.5)
      .setMaxVelocity(300, 10000)
      .setScale(this.spriteScale)
      .setFlipY(!!(this.id % 2))
      .setVisible(false)

    this.displaySprite = scene.add
      .sprite(x, y, "enemy", "enemy1.png")
      .setOrigin(0.5, 0.5)
      .setTint(randomTint)
      .setDisplaySize(this.sprite.displayWidth, this.sprite.displayHeight)

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
    this.displaySprite.anims.create({
      key: "wiggle",
      frameRate: 10,
      frames: this.displaySprite.anims.generateFrameNames("enemy", {
        start: 1,
        end: 2,
        prefix: "enemy",
        suffix: ".png"
      }),
      repeat: -1
    });
    this.displaySprite.anims.create({
      key: "fly",
      frameRate: 10,
      frames: this.displaySprite.anims.generateFrameNames("enemy", {
        start: 3,
        end: 4,
        prefix: "enemy",
        suffix: ".png"
      }),
      repeat: -1
    });
    this.displaySprite.anims.create({
      key: "die_bullet",
      frameRate: 15,
      frames: this.displaySprite.anims.generateFrameNames("enemy", {
        start: 5,
        end: 12,
        prefix: "enemy",
        suffix: ".png"
      }),
      repeat: 0
    });
    this.displaySprite.play('die_bullet', true);
  }

  update(time: number, delta: number) {

    if (this.isDead) {
      this.displaySprite.play('die_bullet', true);
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
    if (distToPlayer < 50) {
      // debatable..
      // this.isGrabbing = true;
      this.facePlayer();
    }



    // idea:
    // move this to player, so we can better check for other grabbers
    // and make the all grabbers rotate with the player
    // add a caontainer to he player? less hustle?
    // add them temporaily to the container    
    if (this.isGrabbing) {
      // attach the zombie to the player at a distance of 15
      //Phaser.Actions.PlaceOnCircle()
      // Phaser.Actions.RotateAroundDistance(
      //   [this.sprite],
      //   { x: this.scene.player.sprite.x, y: this.scene.player.sprite.y },
      //   Phaser.Math.FloatBetween(0.1, 0.01),
      //   10
      // );
      Phaser.Actions.PlaceOnCircle([this.sprite], this.scene.player.grabCircle, this.id, this.id + 0.01)
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

        // 1-5  normal
        // 6-7  attack
        // 8-11 die
        if (!this.isFlying) {
          this.scene.zombieSfx.play(
            Phaser.Math.Between(1, 5) + '', {
            rate: Phaser.Math.FloatBetween(0.7, 1),
            detune: Phaser.Math.FloatBetween(0, 50),
            source: {
              x: this.sprite.x,
              y: this.sprite.y,
              ...C_SPATIAL_AUDIO
            },
            loop: false
          });
        }


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
        let speed = delta * Phaser.Math.FloatBetween(ENEMY_SPEED / 2, ENEMY_SPEED); // Set the speed at which the sprite should move
        // let velocityX = Math.cos(rotation) * speed;
        // let velocityY = Math.sin(rotation) * speed;
        // // Set the velocity of the sprite
        // sprite.setVelocity(velocityX, velocityY);
        const path = this.scene.getPathToPlayer(this.sprite.body.position);

        if (path.length && path[1]) {
          // const targetGridPos = path[1] as Phaser.Math.Vector2;
          const tile = this.scene.mapFloor.getTileAt(path[1][0], path[1][1]);
          if (tile) {
            const targetPoint = new Phaser.Math.Vector2(tile.pixelX, tile.pixelY);
            const rotation = Phaser.Math.Angle.BetweenPoints(this.sprite.body.position, targetPoint);
            let velocityX = Math.cos(rotation) * speed;
            let velocityY = Math.sin(rotation) * speed;
            sprite.setRotation(rotation);
            // Set the velocity of the sprite
            sprite.setVelocity(velocityX, velocityY);
          }
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
        this.displaySprite.play('wiggle', true);

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

    // if this.isGrabbing lerp position and inste4ad

    if (this.isGrabbing) {
      const delayFactorPos = 0.25;
      const delayFactorRot = 0.05;
      // Calculate the new positions with delay
      const newX = Phaser.Math.Linear(
        this.displaySprite.x,
        this.sprite.x,
        delayFactorPos
      );
      const newY = Phaser.Math.Linear(
        this.displaySprite.y,
        this.sprite.y,
        delayFactorPos
      );
      const newRotation = Phaser.Math.Linear(
        this.displaySprite.rotation,
        this.sprite.rotation,
        delayFactorRot
      );
      this.displaySprite
        .setPosition(newX, newY)
        .setRotation(newRotation)
        .setScale(this.spriteScale + Math.sin(time / (40 + this.t)) * 0.1)
    } else {
      // this.sprite.texture.getSourceImage.
      this.displaySprite
        .setPosition(this.sprite.x, this.sprite.y)
        .setRotation(this.sprite.rotation)
        .setScale(this.spriteScale + Math.sin(time / (40 + this.t)) * 0.1)
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
      if (this.displaySprite) {
        this.displaySprite.play('wiggle', true);
      }
    }
  }

  startGrabbingPlayer() {
    this.isGrabbing = true;
    this.isWalking = false;
    this.isFlying = false;
    if (this.displaySprite) {
      this.displaySprite.play('wiggle', true);
      this.resetVisibility();
    }
    this.scene.player.attachedEnemies.push(this.id);
  }

  stopGrabbingPlayer() {
    this.isGrabbing = false;
    this.isWalking = false;
    this.isFlying = false;

    if (this.sprite) {
      this.magicCircle();
      this.flyingCoolDownMs = FLYING_COOLDOWN_MS;
      //@ts-ignore
      this.lastFloorTile = null;

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
      // 1-5  normal
      // 6-7  attack
      // 8-11 die
      this.scene.zombieSfx.play(
        Phaser.Math.Between(6, 7) + '', {
        rate: Phaser.Math.FloatBetween(0.7, 1),
        detune: Phaser.Math.FloatBetween(0, 50),
        source: {
          x: this.sprite.x,
          y: this.sprite.y,
          ...C_SPATIAL_AUDIO
        },
        loop: false
      });
      this.displaySprite.play('fly', true);
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

  resetVisibility() {
    if (this.visibilityTween) { this.visibilityTween.destroy() }
    this.displaySprite.setAlpha(1);
  }

  setInCone() {
    this.resetVisibility();
    if (!this.isDead && !this.isGrabbing) {
      this.visibilityTween = this.scene.tweens.add({
        targets: this.displaySprite,
        alpha: 0,
        startDelay: 1000,
        duration: 0,
        // onComplete: () => {
        //   console.log('invisible zombie');
        // }
      })
    }
  }

  dieFromBullet(bulletVector: Phaser.Math.Vector2) {
    this.isDead = true;
    this.resetVisibility();
    // 1-5  normal
    // 6-7  attack
    // 8-11 die

    this.scene.zombieSfx.play(
      Phaser.Math.Between(8, 11) + '', {
      rate: Phaser.Math.FloatBetween(0.7, 1),
      detune: Phaser.Math.FloatBetween(0, 50),
      source: {
        x: this.sprite.x,
        y: this.sprite.y,
        ...C_SPATIAL_AUDIO
      },
      loop: false
    });

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
    this.displaySprite.play('die_bullet', true);
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
      this.displaySprite.play('die_bullet', Phaser.Math.FloatBetween(0, 1) > 0.75 ? true : false);
      emitter.stop();
      graphics.lineTo(this.sprite.x + Phaser.Math.Between(-15, 15), this.sprite.y + Phaser.Math.Between(-1, 1));
      //graphics.strokeCircle(this.sprite.x + (odds % 2 ? -5 : 5), this.sprite.y + (odds % 2 ? -5 : 5), 5);
      graphics.closePath();
      graphics.strokePath();
      timerEvent.destroy();
      this.sprite.body.destroy();
      this.scene.time.delayedCall(500, () => {
        // todo: 
        const footprintTrigger = this.scene.physics.add.image(this.displaySprite.x, this.displaySprite.y, '__WHITE').setScale(2).setVisible(false);
        this.scene.physics.world.addOverlap(this.scene.player.sprite, footprintTrigger, (_, _footprintTrigger) => {
          // shoes fully soaking with blood
          this.scene.player.footprintAlpha = 1;
          footprintTrigger.destroy();
        });
        this.displaySprite.play('die_bullet', true);
        this.scene.time.delayedCall(500, () => {
          // all stuff to render texture
          this.scene.rt.draw(this.displaySprite, this.displaySprite.x, this.displaySprite.y);
          this.sprite.setVisible(false).destroy();
          this.displaySprite.destroy();
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
    this.displaySprite.destroy();
    this.sprite.destroy();
  }
}


