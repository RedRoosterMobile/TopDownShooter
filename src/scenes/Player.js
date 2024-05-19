
/**
 * A class that wraps up our 2D platforming player logic. It creates, animates and moves a sprite in
 * response to WASD/arrow keys. Call its update method from the scene's update and call its destroy
 * method when you're done with the player.
 */



export default class Player {
  bullets = [];
  /**
   *
   * @param {Phaser.Scene} scene
   * @param {*} x
   * @param {*} y
   */
  constructor(scene, x, y, wallLayer) {
    this.scene = scene;
    this.groundLayer = wallLayer;
    // Create the physics-based sprite that we will move around and animate
    this.sprite = scene.physics.add
      .sprite(x, y, "player")
      .setDrag(500, 500)
      .setMaxVelocity(300, 10000);

    // Track the arrow keys & WASD
    const { LEFT, RIGHT, UP, DOWN, W, A, D, SPACE } =
      Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: LEFT,
      right: RIGHT,
      down: DOWN,
      up: UP,
      w: W,
      a: A,
      d: D,
      space: SPACE
    });
  }

  update(time, delta) {
    const keys = this.keys;
    const sprite = this.sprite;

    const acceleration = 60;   
      // Apply horizontal acceleration when left/a or right/d are applied
      if (keys.left.isDown ) {
        //sprite.setAccelerationX(-acceleration);
        sprite.setVelocityX(-acceleration);
        // No need to have a separate set of graphics for running to the left & to the right. Instead
        // we can just mirror the sprite.
        //sprite.setFlipX(true);
        //this.scene.cameras.main.setFollowOffset(100);
      } else if (keys.right.isDown) {
        //sprite.setAccelerationX(acceleration);
        sprite.setVelocityX(acceleration);
        //sprite.setFlipX(false);
        //this.scene.cameras.main.setFollowOffset(-100);
      } else if (keys.up.isDown){
        //sprite.setAccelerationX(0);
        sprite.setVelocityY(-acceleration);
      } else if (keys.down.isDown){
        //sprite.setAccelerationX(0);
        sprite.setVelocityY(+acceleration);
      }  
      
  }


  normalizedDistance(sprite, shell) {
    const distance = Phaser.Math.Distance.Between(
      sprite.x,
      sprite.y,
      shell.x,
      shell.y
    );
    const maxDistance = Math.sqrt(
      Math.pow(this.scene.game.config.width, 2) +
        Math.pow(this.scene.game.config.height, 2)
    );

    const normalizedDistance = distance / maxDistance;
    return normalizedDistance;
  }

  destroy() {
    //this.scene.events.destroy();
    this.sprite.destroy();
  }
}

// helper
function darken(colInt, factor) {
  let color = Phaser.Display.Color.ValueToColor(colInt);
  let r = color.red;
  let g = color.green;
  let b = color.red;

  r = Math.max(0, r - factor);
  g = Math.max(0, g - factor);
  b = Math.max(0, b - factor);

  return Phaser.Display.Color.GetColor(r, g, b);
}
