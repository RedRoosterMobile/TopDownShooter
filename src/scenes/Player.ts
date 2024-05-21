import Enemy from "./Enemy";
import { Game } from "./Game";

const BULLET_VELOCITY = 250 * 2;
const SHELL_VELOCITY = 150;
const SHOOTING_FREQUENCY = 200;
const weaponScreenshake = 0.00025;
const weaponKnockback = 50;

const DEBUG_CIRCLES = true;
const INNER_CIRCLE_RADIUS = 50;
const OUTER_CIRCLE_RADIUS = 100;

export default class Player {
  scene: Game;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  keys: object;
  targetAngle: number;
  public offset: number;
  public nextAngle: number;
  allowShooting: boolean;
  timerEvent: Phaser.Time.TimerEvent;
  legs: Phaser.GameObjects.Sprite;
  innerCircleGaphics: Phaser.GameObjects.Graphics;
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
      .sprite(x, y, "player")
      .setDrag(500, 500)
      .setOrigin(0.5, 0.5)
      .setMaxVelocity(300, 10000);
    const width = this.sprite.width;
    const newWidth = width * 0.35;
    const diff = width - newWidth;
    this.offset = diff / 4 + 0.5;
    this.sprite.setCircle(newWidth, this.offset, this.offset);
    this.allowShooting = true;

    // Track the arrow keys & WASD
    const { LEFT, RIGHT, UP, DOWN, W, A, D, SPACE } =
      Phaser.Input.Keyboard.KeyCodes;

    if (DEBUG_CIRCLES) {
      this.innerCircleGaphics = this.scene.add.graphics({
        lineStyle: { color: 0xffffff, alpha: 1, width: 2 },
        fillStyle: { color: 0xffffff, alpha: 1, }
      });

      this.drawCircle(INNER_CIRCLE_RADIUS);
      this.drawCircle(OUTER_CIRCLE_RADIUS);
    }


    this.keys = scene.input.keyboard ? scene.input.keyboard.addKeys({
      left: LEFT,
      right: RIGHT,
      down: DOWN,
      up: UP,
      w: W,
      a: A,
      d: D,
      space: SPACE
    }) : {};

    this.createAnimations();
  }

  drawCircle(radius: number) {
    this.innerCircleGaphics.strokeCircle(this.sprite.x, this.sprite.y, radius);
  }

  createAnimations() {
    this.legs.anims.create({
      key: "idle",
      frameRate: 10,
      frames: [
        { key: "legs", frame: "sprWaiterLegs_0.png" },
      ]
      ,
      repeat: -1
    });
    this.legs.anims.create({
      key: "walk",
      frameRate: 15,
      frames: this.sprite.anims.generateFrameNames("legs", {
        start: 0,
        end: 15,
        prefix: "sprWaiterLegs_",
        suffix: ".png"
      }),
      repeat: -1
    });
    this.legs.play('walk', true);
  }

  update(time: number, delta: number) {

    const sprite = this.sprite;

    const acceleration = 60 * 2;
    let moveX = 0;
    let moveY = 0;

    // @ts-ignore
    if (this.keys.left.isDown) {
      moveX = -1;
      // @ts-ignore
    } else if (this.keys.right.isDown) {
      moveX = 1;
    }

    // @ts-ignore
    if (this.keys.up.isDown) {
      moveY = -1;
      // @ts-ignore
    } else if (this.keys.down.isDown) {
      moveY = 1;
    }

    // @ts-ignore
    if (this.keys.space.isDown) {
      this.shootBullet(this.sprite);
    }

    // walking animation (sprites)
    // https://sienas.artstation.com/projects/rRrQlO
    // https://www.dropbox.com/sh/dh431ggetqals39/AADwMp6z023Rm2v-pLc3VVNYa/Player?dl=0&subfolder_nav_tracking=1

    // Normalize the movement vector and scale it by the acceleration
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len != 0) {
      sprite.setVelocityX((moveX / len) * acceleration);
      sprite.setVelocityY((moveY / len) * acceleration);

      // Calculate the target angle
      this.targetAngle = Math.atan2(moveY, moveX);

      // Adjust the target angle to ensure shortest rotation
      const angleDiff = this.targetAngle - sprite.rotation;
      if (angleDiff > Math.PI) {
        this.targetAngle -= 2 * Math.PI;
      } else if (angleDiff < -Math.PI) {
        this.targetAngle += 2 * Math.PI;
      }

      // Lerp the sprite's rotation towards the target angle
      const t = delta / 100; // Adjust the speed of rotation
      const nextAngle = lerp(sprite.rotation, this.targetAngle, t);
      sprite.setRotation(nextAngle);
      this.nextAngle = nextAngle;
      this.legs.play('walk', true);
    } else {
      sprite.setRotation(this.targetAngle);
      sprite.setVelocityX(0);
      sprite.setVelocityY(0);
      this.legs.play('idle', true);
    }
    this.legs.copyPosition(sprite);
    this.legs.setRotation(sprite.rotation);
    if (DEBUG_CIRCLES) {
      this.innerCircleGaphics.clear();
      this.drawCircle(INNER_CIRCLE_RADIUS);
      this.drawCircle(OUTER_CIRCLE_RADIUS);
    }

    // imsgine a point at a distance in front of the player
    var offsetX = Math.cos(sprite.rotation) * 50 * -1;
    var offsetY = Math.sin(sprite.rotation) * 50 * -1;
    this.scene.cameras.main.setFollowOffset(offsetX, offsetY);
  }




  // normalizedDistance(sprite, shell) {
  //   const distance = Phaser.Math.Distance.Between(
  //     sprite.x,
  //     sprite.y,
  //     shell.x,
  //     shell.y
  //   );
  //   const maxDistance = Math.sqrt(
  //     Math.pow(this.scene.game.config.width, 2) +
  //       Math.pow(this.scene.game.config.height, 2)
  //   );

  //   const normalizedDistance = distance / maxDistance;
  //   return normalizedDistance;
  // }


  shootBullet(sprite: Phaser.GameObjects.Sprite) {
    if (!this.allowShooting) return;
    this.allowShooting = false;
    // ----- bullet ----------
    const bulletScale = 0.5;
    const distanceFromCenterX = 8;
    const randomStartPos = 2;
    const bulletX = sprite.x + (distanceFromCenterX * Math.cos(sprite.rotation)); // Adjust spawn position based on player direction
    const bulletY = sprite.y + (distanceFromCenterX * Math.sin(sprite.rotation)) + Phaser.Math.Between(-randomStartPos, randomStartPos);

    const bullet = this.scene.physics.add
      .sprite(bulletX, bulletY, "sprites", "sprBullet2_0.png")
      .setScale(bulletScale)
      .setRotation(sprite.rotation).setTint(0x000000);
    bullet.body.setSize(
      bullet.displayWidth * 0.75,
      bullet.displayHeight * 0.45
    );



    // muzzle
    this.scene.time.delayedCall(3, () => {
      bullet.setFrame("sprBullet2_1.png");
    });
    // shooting frequency
    this.scene.time.delayedCall(SHOOTING_FREQUENCY, () => {
      this.allowShooting = true;
    });

    const light = this.scene.createLight()
      .setIntensity(0)
      .setRadius(0);
    // make light fly along
    // this.timerEvent = this.scene.time.addEvent({
    //   delay: 50,
    //   callback: () => { light.setPosition(bullet.x, bullet.y) },
    //   loop: true
    // });

    const impactFlickerTime = 5;
    this.scene.tweens.add({
      targets: light,
      duration: impactFlickerTime,
      intensity: 1.5 + Phaser.Math.FloatBetween(0, 0.7),
      ease: 'Power2',
      radius: 200 + Phaser.Math.Between(-5, 5),
    })

    this.scene.enemies.forEach((enemyObj) => {
      this.scene.physics.world.addCollider(
        bullet,
        enemyObj.sprite,
        (_bullet, enemy) => {
          // find enemy in enemies
          const foundEnemy = this.scene.enemies.filter((_enemy) => { return enemy === _enemy.sprite })

          if (foundEnemy.length) {
            // filter found one
            this.scene.enemies = this.scene.enemies.filter((_enemy) => { return enemy !== _enemy.sprite })

            console.log('enemy hit', enemy, foundEnemy[0]);
            const ec: Enemy = foundEnemy[0];
            ec.dieFromBullet(bullet.body.velocity.clone());
            //@ts-ignore
            this.explosion(ec.sprite);
            // ec.destroy();

            // ----- screen pizzazz ----------
            // make dependent on zoom
            this.scene.cameras.main.shake(20, weaponScreenshake);

            // kill bullet
            _bullet.destroy();
          }
        });

    })


    // ----- bullet ground collisions  ----------
    this.scene.physics.world.addCollider(
      bullet,
      this.collisionLayer,
      (bullet, groundLayer) => {


        //let currentTint = groundLayer.tint;
        //groundLayer.tint = darken(currentTint, 2.2);

        // impact animation
        const bulletImpact = this.scene.add
          .sprite(
            // @ts-ignore
            bullet.x,
            // @ts-ignore
            bullet.y,
            "sprites",
            "sprBulletHit_0.png"
          )
          //.setScale(2)
          .setAlpha(0.781)
        // @ts-ignore
        light.setPosition(bullet.x, bullet.y)//.setVisible(true);<

        bulletImpact.anims.create({
          key: "impact",
          frames: sprite.anims.generateFrameNames("sprites", {
            start: 0,
            end: 2,
            prefix: "sprBulletHit_",
            suffix: ".png"
          }),
          frameRate: 10
        });
        bulletImpact.play("impact");
        bulletImpact.setRotation(sprite.rotation);

        this.scene.time.delayedCall(400, () => {
          bulletImpact.destroy();
          light.setVisible(false);
          // @ts-ignore
          //light.destroy();
          this.scene.tweens.add({
            targets: light,
            intensity: 0,
            radius: 0,
            duration: impactFlickerTime,
            ease: 'Power2',

          })
        })
        //@ts-ignore
        this.explosion(bullet);
        // ----- screen pizzazz ----------
        // make dependent on zoom
        this.scene.cameras.main.shake(20, weaponScreenshake);

        // kill bullet
        bullet.destroy();
      }
    );

    // ----- shells ----------
    const shell = this.scene.physics.add
      .sprite(sprite.x, sprite.y, "sprites", "sprShell_0.png")
      //.setScale(1)
      .setBounce(0.1)
      .setDrag(20)
      .setRotation(bullet.rotation + Phaser.Math.DegToRad(Phaser.Math.Between(-4.5, +4.5)))
    //.setAngle(Phaser.Math.Between(0, 9));
    shell.body.setSize(shell.displayWidth * 0.1, shell.displayHeight * 0.1);

    // maybe cooler to fly to the side in a curve?
    const error = Phaser.Math.FloatBetween(-0.1, 0.1)
    // set bullet velocity the other direction
    shell.body.setVelocity(
      SHELL_VELOCITY * Math.cos(sprite.rotation + error - Math.PI / 2),
      SHELL_VELOCITY * Math.sin(sprite.rotation + error - Math.PI / 2)
    );
    this.scene.physics.world.addCollider(
      shell,
      this.collisionLayer,
      (_, groundLayer) => {
        // When the shell hits the ground, stop its horizontal movement
        //shell.body.setVelocityX(Math.max(shell.body.velocity.x - 20, 0));
      }
    );

    // disable body after a while
    this.scene.time.delayedCall(2000, () => {
      shell.body.setEnable(false);
    });

    const velocity = BULLET_VELOCITY;
    // set bullet velocity
    bullet.setVelocity(
      velocity * Math.cos(sprite.rotation),
      velocity * Math.sin(sprite.rotation)
    );

    // ----- knockback ----------
    const scaler = 1;
    const intensity = weaponKnockback;
    const randomX = Phaser.Math.FloatBetween(-intensity, intensity);
    const randomY = Phaser.Math.FloatBetween(-intensity, intensity);
    this.sprite.setAcceleration(bullet.body.velocity.x * -scaler + randomX, bullet.body.velocity.y * -scaler + randomY)
    this.scene.time.delayedCall(100, () => {
      this.sprite.setAcceleration(0, 0);
    })

    this.scene.cameras.main.shake(20, weaponScreenshake);
  }

  explosion(bullet: Phaser.GameObjects.Sprite) {
    const explosionYRnd = 10;
    const bulletExplosionOnGround = this.scene.add
      .sprite(
        bullet.x,
        bullet.y + Phaser.Math.FloatBetween(-explosionYRnd, explosionYRnd),
        "sprites",
        "sprExplosion_0.png"
      )
      .setScale(Phaser.Math.FloatBetween(0.25, 1))
      .setAlpha(0.781);

    bulletExplosionOnGround.anims.create({
      key: "explosion",
      frames: bulletExplosionOnGround.anims.generateFrameNames("sprites", {
        start: 0,
        end: 1,
        prefix: "sprExplosion_",
        suffix: ".png"
      }),
      frameRate: 4,
      repeat: -1
    });
    bulletExplosionOnGround.play("explosion");

    // this.scene.sound.play("explosion", {
    //   rate: Phaser.Math.FloatBetween(0.5, 1),
    //   volume: volume
    // });
    this.scene.time.delayedCall(
      400,
      () => {
        const smoke = this.scene.add
          .sprite(
            bulletExplosionOnGround.x,
            bulletExplosionOnGround.y,
            "sprites",
            "sprSmoke_0.png"
          )
          .setScale(Phaser.Math.FloatBetween(0.25, 1));
        const smokeDistance = 5;
        this.scene.tweens.add({
          targets: smoke,
          alpha: { from: 1, to: 0 },
          x: { from: smoke.x, to: smoke.x + Phaser.Math.FloatBetween(-smokeDistance, smokeDistance) },
          y: { from: smoke.y, to: smoke.y + Phaser.Math.FloatBetween(-smokeDistance, smokeDistance) },
          duration: 2000 + Phaser.Math.FloatBetween(-200, 200),
          onComplete: () => {
            smoke.destroy();
          }
        });

        bulletExplosionOnGround.destroy();
      },
      [],
      this
    );
  }

  destroy() {
    //this.scene.events.destroy();
    this.sprite.destroy();
  }
}

// helper
// function darken(colInt, factor) {
//   let color = Phaser.Display.Color.ValueToColor(colInt);
//   let r = color.red;
//   let g = color.green;
//   let b = color.red;

//   r = Math.max(0, r - factor);
//   g = Math.max(0, g - factor);
//   b = Math.max(0, b - factor);

//   return Phaser.Display.Color.GetColor(r, g, b);
// }
function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}

