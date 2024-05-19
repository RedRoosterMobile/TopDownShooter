const BULLET_VEOCITY = 250;

export default class Player {
  scene: Phaser.Scene;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  keys: object;
  targetAngle: number;
  public offset: number;
  public nextAngle: number;
  allowShooting: boolean;
  /**
   *
   * @param {Phaser.Scene} scene
   * @param {*} x
   * @param {*} y
   */
  constructor(scene: Phaser.Scene, x: number, y: number, wallLayer: Phaser.Tilemaps.TilemapLayer) {
    this.scene = scene;
    this.collisionLayer = wallLayer;
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
    } else {
      sprite.setRotation(this.targetAngle);
      sprite.setVelocityX(0);
      sprite.setVelocityY(0);
    }

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
      .setRotation(sprite.rotation);
    bullet.body.setSize(
      bullet.displayWidth * 0.75,
      bullet.displayHeight * 0.45
    );

    // muzzle
    this.scene.time.delayedCall(3, () => {
      bullet.setFrame("sprBullet2_1.png");

    });
    // shooting frequency
    this.scene.time.delayedCall(300, () => {
      this.allowShooting = true;
    });

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
        });
        // this.explosion(bullet);

        // kill bullet
        bullet.destroy();
      }
    );
    const velocity = BULLET_VEOCITY;
    // set bullet velocity
    bullet.setVelocity(
      velocity * Math.cos(sprite.rotation),
      velocity * Math.sin(sprite.rotation)
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

