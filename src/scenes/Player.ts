export default class Player {
  scene: Phaser.Scene;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  keys: object;
  /**
   *
   * @param {Phaser.Scene} scene
   * @param {*} x
   * @param {*} y
   */
  constructor(scene:Phaser.Scene, x:number, y:number, wallLayer:Phaser.Tilemaps.TilemapLayer) {
    this.scene = scene;
    this.collisionLayer = wallLayer;
    // Create the physics-based sprite that we will move around and animate
    this.sprite = scene.physics.add
      .sprite(x, y, "player")
      .setDrag(500, 500)
      .setMaxVelocity(300, 10000);
    const width = this.sprite.width;
    const newWidth= width*0.35;
    const diff = width-newWidth;
    this.sprite.setCircle(newWidth,diff/4+0.5,diff/4+0.5)

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
  
  update(time:number, delta:number) {
    
    const sprite = this.sprite;

    const acceleration = 60;
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

    // Normalize the movement vector and scale it by the acceleration
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len != 0) {
      sprite.setVelocityX((moveX / len) * acceleration);
      sprite.setVelocityY((moveY / len) * acceleration);
      
      // Calculate the target angle
      const targetAngle = Math.atan2(moveY, moveX);

      // Lerp the sprite's rotation towards the target angle
      const t = delta / 100; // Adjust the speed of rotation
      const nextAngle = lerp(sprite.rotation, targetAngle, t);
      sprite.setRotation(nextAngle);
    } else {
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

