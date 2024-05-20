import { Scene } from 'phaser';
// @ts-ignore
import Player from './Player'
import PhaserRaycaster from 'phaser-raycaster'

const PLAYER_SPAWN = "Spawn Point";
const PLAYER_INNER_CONE = 0.5 * Math.PI;
const PLAYER_CONSTANT_LIGHT_CIRCLE = 5;
const FOV_ALPHA_MAIN = 0.8; // higher is darker
const INNER_LIGHT_CIRCLE = {
  intensity: 2,
  //color: 0xff0000, 
  color: 0x808080,
  radius: 200
};

export class Game extends Scene {
  raycasterPlugin: PhaserRaycaster
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  playerGraphics: Phaser.GameObjects.Graphics;
  player: Player;
  light: Phaser.GameObjects.Light;

  mapWalls: Phaser.Tilemaps.TilemapLayer | null;

  intersections: any;
  graphics: Phaser.GameObjects.Graphics;
  maskGraphics: Phaser.GameObjects.Graphics;
  mask: Phaser.Display.Masks.GeometryMask;
  fow: Phaser.GameObjects.Graphics;
  map: Phaser.Tilemaps.Tilemap;
  raycaster: any;
  ray: any;
  vignetteFx: Phaser.FX.Vignette;
  rotateCameraTime: number;

  // msg_text: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  create() {
    this.camera = this.cameras.main;
    this.rotateCameraTime = 0;
    // this.camera.postFX.addBloom()
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

    this.map = this.make.tilemap({ key: "map" });
    const tiles = this.map.addTilesetImage(
      "CosmicLilac_Tiles",
      "tiles"
    );
    // @ts-ignore
    const mapFloor = this.map.createLayer("floor", tiles).setPipeline('Light2D');
    // @ts-ignore
    this.mapWalls = this.map.createLayer("walls", tiles);//.setPipeline('Light2D');
    // @ts-ignore
    this.mapWalls.setCollisionByProperty({ collides: true });
    this.camera.setZoom(4)

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    const spawnPoint = this.map.findObject(
      "Objects",
      (obj) => obj.name === PLAYER_SPAWN
    );
    console.log(spawnPoint);
    // @ts-ignore
    this.player = new Player(this, spawnPoint.x, spawnPoint.y, this.mapWalls);
    this.player.sprite.body.setCollideWorldBounds(true);

    this.cameras.main.startFollow(this.player.sprite, true, 0.05, 0.05);


    // @ts-ignore
    this.physics.world.addCollider(this.player.sprite, this.mapWalls);

    this.cameras.main.startFollow(this.player.sprite, true, 0.05, 0.05);

    this.createRaycast();
    this.createLights();
    this.createVignette()
  }
  createLights() {
    this.lights.enable();

    //this.lights.setAmbientColor(0x808080);
    this.lights.setAmbientColor(INNER_LIGHT_CIRCLE.color);

    this.light = this.createLight();
    // @ts-ignore
    // window.ll = this.light;
  }

  public createLight(): Phaser.GameObjects.Light {
    const light = this.lights.addLight(0, 0, INNER_LIGHT_CIRCLE.radius);
    light.setIntensity(INNER_LIGHT_CIRCLE.intensity);
    return light
  }

  createVignette() {
    //console.log(this.maskGraphics.postFX);
    this.vignetteFx =
      this.camera.postFX.addVignette(0, 0, 0.9, 0.5);
    // this.camera.setZoom(0.5)
    //  this.vignetteFx.radius = 1;
    //  this.vignetteFx.strength = 0.9;
  }

  createRaycast() {
    //advanced debug mode options

    this.raycaster = this.raycasterPlugin.createRaycaster({
      debug: {
        enabled: false, //enable debug mode
        maps: true, //enable maps debug
        rays: true, //enable rays debug
        graphics: {
          ray: 0x00ff00, //debug ray color; set false to disable
          rayPoint: 0xff00ff, //debug ray point color; set false to disable
          mapPoint: 0x00ffff, //debug map point color; set false to disable
          mapSegment: 0x0000ff, //debug map segment color; set false to disable
          mapBoundingBox: 0xff0000 //debug map bounding box color; set false to disable
        }
      }
    })

    this.ray = this.raycaster.createRay({
      origin: {
        x: 400,
        y: 300
      }
    });

    //map tilemap layer
    //this.map = this.make.tilemap();
    console.log(this.mapWalls);
    // window.gl = this.mapWalls.setCollisionByProperty({ collides: true });
    //this.groundLayer.tileset

    // 600 tiles???
    let array = Array.from({ length: 600 }, (_, i) => i + 1);

    this.raycaster.mapGameObjects(this.mapWalls, false, {
      collisionTiles: array
    });
    this.ray.setOrigin(this.player.sprite.x, this.player.sprite.y);
    // TODO:
    // https://codepen.io/wiserim/pen/pojNmRK
    //set ray's cone angle (in radians)
    // cone example
    // https://codepen.io/wiserim/pen/KKpoVKb?editors=1010

    // check draw() function!!!!
    this.ray.setCone(PLAYER_INNER_CONE);



    //cast rays in a cone
    this.intersections = this.ray.castCone();

    this.graphics = this.add.graphics({
      lineStyle: { width: 1, color: 0x00ff00 },
      fillStyle: { color: 0xffffff, alpha: 0.3 }
    });
    this.createFOV();

    //set depths
    this.fow.setDepth(100);
    //topTilemapLayer.setDepth(2);
    this.graphics.setDepth(3);


    // //enable auto slicing field of view
    this.ray.autoSlice = true;
    // //enable arcade physics body
    this.ray.enablePhysics();
    // //set collision (field of view) range
    this.ray.setCollisionRange(16 * 3);
    // //cast ray




    //draw rays
    this.drawIntersections();
    // //get objects in field of view
    // visibleObjects = this.ray.overlap(group.getChildren());

    // //check if object is in field of view
    // visibleObjects = this.ray.overlap(gameObject);

    // //add overlap collider (require passing ray.processOverlap as process callback)
    // this.physics.add.overlap(
    //   this.ray,
    //   targets,
    //   function (rayFoVCircle, target) {
    //     /*
    //      * What to do with game objects in line of sight.
    //      */
    //   },
    //   this.ray.processOverlap.bind(this.ray)
    // );
  }

  // draw ray intersection
  drawIntersections() {
    //clear field of view mask
    this.maskGraphics.clear();
    //     let radius = 32;
    //         let intensity = 1;
    //         let attenuation = 0.5;
    // // @ts-ignore
    //         let light = this.add.pointlight(this.player.sprite.x, this.player.sprite.y, 0, radius, intensity);
    //         light.color.setTo(255, 255, 255);
    //         light.attenuation=attenuation;
    //         console.log(light);
    //     this.maskGraphics.createBitmapMask(light);
    //draw fov mask
    this.maskGraphics.fillPoints(this.intersections);
    this.maskGraphics.fillCircle(this.player.sprite.x, this.player.sprite.y, PLAYER_CONSTANT_LIGHT_CIRCLE)
  }

  //create field of view
  createFOV() {
    this.maskGraphics = this.add.graphics({
      fillStyle: { color: 0xffffff, alpha: 0 }
    });
    this.mask = new Phaser.Display.Masks.GeometryMask(this, this.maskGraphics);

    this.mask.setInvertAlpha();
    this.fow = this.add
      .graphics({ fillStyle: { color: 0x000000, alpha: FOV_ALPHA_MAIN } })
      .setDepth(2);
    this.fow.setMask(this.mask);
    this.fow.fillRect(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.fow.setPipeline("Light2D");
  }

  // drunk effect
  rotateCamera(delta: number) {
    // take player movement into account. vectors?
    // hotline miami stlye https://www.youtube.com/watch?v=hT-dyANbHDY
    const isMoving = this.player.sprite.body.velocity.length();
    if (isMoving) {
      this.rotateCameraTime += delta;
      const rotation = Math.sin(this.rotateCameraTime / 3000) * 0.01 * Math.PI;
      this.camera.setRotation(rotation);
    }
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.rotateCamera(delta);
    if (this.vignetteFx) {
      // const zto1= Math.sin(time/500)*0.05;
      // this.vignetteFx.x = 0.5+zto1;//this.player.sprite.x/Number(this.game.config.width);
      // this.vignetteFx.y = 0.5+zto1;//this.player.sprite.y/Number(this.game.config.height);

      // battery low effect:
      const zto1 = Math.sin(time / 5) * 0.05;
      this.vignetteFx.x = 0.5 + zto1;//this.player.sprite.x/Number(this.game.config.width);
      this.vignetteFx.y = 0.5 + zto1;//this.player.sprite.y/Number(this.game.config.height);

    }
    this.drawLights();

    //get all game objects in field of view (which bodies overlap ray's field of view)
    //let visibleObjects = this.ray.overlap();
    //console.log(visibleObjects);
  }

  drawLights() {
    const delayFactor = 0.25;
    // Calculate the new positions with delay
    const newX = Phaser.Math.Linear(
      this.ray.origin.x,
      this.player.sprite.x,
      delayFactor
    );
    const newY = Phaser.Math.Linear(
      this.ray.origin.y,
      this.player.sprite.y,
      delayFactor
    );

    this.ray.setAngle(this.player.sprite.rotation);
    // Set the new position of the ray
    this.ray.setOrigin(newX, newY)

    //cast ray in all directions
    this.ray.setCone(PLAYER_INNER_CONE);
    this.light.setPosition(newX, newY);

    // cast rays in a cone
    this.intersections = this.ray.castCone();
    // add player position (to paint the full thing)
    this.intersections.push({ x: this.player.sprite.x, y: this.player.sprite.y })

    // redraw
    this.drawIntersections();
  }
}
