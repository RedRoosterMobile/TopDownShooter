
import { Scene } from 'phaser';
import HorrifiPostFx from 'phaser3-rex-plugins/plugins/horrifipipeline.js';
// @ts-ignore
import Player from './Player'
import PhaserRaycaster from 'phaser-raycaster'
import Enemy from './Enemy';
import { C_SPATIAL_AUDIO } from './Constants';
//import 'pathfinding'
var PF = require('pathfinding');

const PLAYER_SPAWN = "Spawn Point";
const ENEMY = "Enemy";
const PLAYER_INNER_CONE = 0.45 * Math.PI;
const INNER_CIRCLE_RADIUS = 16 * 4;
const PLAYER_CONSTANT_LIGHT_CIRCLE = 7.5; // better make it a (rounded) rectangle??
const FOV_ALPHA_MAIN = 0.8; // higher is darker: was 0.8


const FLOOR_LIGHT_TINT = {
  intensity: 1,
  //color: 0xff0000, 
  color: 0x808080,
  lightColor: 0xaaaaaa,
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
  enemies: Array<Enemy>;
  keyN: Phaser.Input.Keyboard.Key;
  mapFloor: Phaser.Tilemaps.TilemapLayer;
  rt: Phaser.GameObjects.RenderTexture;
  music: Phaser.Sound.WebAudioSound;
  enemyId: number;
  zombieSfx: Phaser.Sound.WebAudioSound | Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound;
  matrix: any;

  // msg_text: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
    this.enemyId = 0;
  }

  noSpatial3() {
    //this is the webaudio loooooppppppp
    //enter url in the next line
    var url = 'assets/music.m4a';

    /* --- set up web audio --- */
    //create the context
    var context = new AudioContext();
    // buffer variable to store audio data
    //@ts-ignore
    var audioBuffer;
    //@ts-ignore
    var source = null;
    var startTime = 0;
    var currentTime = 0;

    /* --- load buffer ---  */
    var request = new XMLHttpRequest();
    //open the request
    request.open('GET', url, true);
    //webaudio paramaters
    request.responseType = 'arraybuffer';
    //Once the request has completed... do this
    request.onload = function () {
      context.decodeAudioData(request.response, function (response) {
        audioBuffer = response;
        playAudio();
      }, function () { console.error('The request failed.'); });
    }
    //Now that the request has been defined, actually make the request. (send it)
    request.send();

    // function to play audio
    function playAudio() {
      //@ts-ignore
      if (audioBuffer) {
        stopAudio(); // Stop any existing audio before starting a new one
        source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(context.destination);
        startTime = context.currentTime - currentTime;
        source.start(0, currentTime % audioBuffer.duration);
      }
    }

    // function to stop audio
    function stopAudio() {
      //@ts-ignore
      if (source) {
        currentTime = context.currentTime - startTime;
        source.stop();
        source.disconnect();
        source = null;
      }
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopAudio();
      } else {
        context.resume().then(() => {
          playAudio();
        });
      }
    });
  }

  create() {
    //this.input.once('pointerdown', () => {
    this.noSpatial3();
    //});
    // this.music = this.sound.add('music', {
    //   loop: true, source: {
    //     x: 0,
    //     y: 0,
    //     refDistance: 10000
    //   }
    // }) as Phaser.Sound.WebAudioSound;
    // //@ts-ignore
    // window.mm = this.music;


    this.zombieSfx = this.sound.addAudioSprite('zombies');

    this.camera = this.cameras.main;
    this.rotateCameraTime = 0;
    //this.camera.setBackgroundColor(0x00ff00);
    //this.camera.setBackgroundColor(0x000000);

    this.background = this.add.image(512, 384, 'background');
    this.background.setAlpha(0.5);
    this.enemies = [];


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
    this.mapFloor = this.map.createLayer("floor", tiles).setPipeline('Light2D');

    this.rt = this.createRenderTexture(this.map.widthInPixels, this.map.heightInPixels);

    // @ts-ignore
    this.mapWalls = this.map.createLayer("walls", tiles);//.setPipeline('Light2D');
    // @ts-ignore
    this.mapWalls.setCollisionByProperty({ collides: true });
    // //@ts-ignore
    // const board = CreateBoardFromTilemap(this.map, [this.mapFloor, this.mapWalls]);
    // console.log(board);
    // board.



    //Walkability matrix. Zero is walkable, One is not
    // var matrix = [
    //   [0, 0, 1, 0, 0],
    //   [0, 0, 1, 0, 0],
    //   [0, 0, 0, 0, 0],
    //   [0, 0, 1, 0, 0],
    // ];
    // console.log(matrix);

    // var grid = new PF.Grid(matrix);
    // var finder = new PF.AStarFinder();
    // //Find path from (1, 2) to (4, 2)
    // var path = finder.findPath(0, 0, 4, 3, grid);

    // https://fantasysphere.games/devlogs/page/2/
    // console.log('kjbiubku');
    // console.log(this.mapFloor.getTilesWithinWorldXY(300, 250, 1, 1));

    this.camera.setZoom(4);

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    const spawnPoint = this.map.findObject(
      "Objects",
      (obj) => obj.name === PLAYER_SPAWN
    );
    console.log(spawnPoint);
    // @ts-ignore
    this.player = new Player(this, spawnPoint.x, spawnPoint.y, this.mapWalls);

    // this.music.play({
    //   loop: true,
    //   // needed to hear music
    //   // source: {
    //   //   // coneInnerAngle:0,
    //   //   // coneOuterAngle:360,
    //   //   // coneOuterGain:0,
    //   //   panningModel: 'equalpower',
    //   //   //rolloffFactor: 0,
    //   //   // maxDistance:0.01,
    //   //   //follow:this.player.sprite,
    //   //   //distanceModel: 'inverse',
    //   //   refDistance: 100000,
    //   //   maxDistance: 100001
    //   // }
    // });
    // @ts-ignore
    this.sound.setListenerPosition(spawnPoint.x, spawnPoint.y);
    this.player.sprite.body.setCollideWorldBounds(true);
    this.initPathfindingMatrix();
    this.spawnEnemies();

    // @ts-ignore
    this.physics.world.addCollider(this.player.sprite, this.mapWalls);

    this.cameras.main.startFollow(this.player.sprite, true, 0.025, 0.025);

    this.createRaycast();
    this.createLights();
    //this.createVignette()
    this.createHorrifyFx();
    this.createInput();
  }

  initPathfindingMatrix() {
    this.matrix = [];
    this.mapWalls?.layer.data.forEach((row: Phaser.Tilemaps.Tile[]) => {
      this.matrix.push(row.map((entryTile: Phaser.Tilemaps.Tile) => {
        return entryTile.collides ? 1 : 0;
      }))
    });
  }

  getPathToPlayer(enemyPosition: Phaser.Math.Vector2): any[] {
    const playerPosition = this.player.sprite.body.position;
    try {
      const pfGrid = new PF.Grid(this.matrix);
      //   Always: 1,
      // Never: 2,
      // IfAtMostOneObstacle: 3,
      // OnlyWhenNoObstacles: 4
      const pfFinder = new PF.AStarFinder({
        diagonalMovement: 4,
        weight: 5
      });

      const enemyTiles: Phaser.Tilemaps.Tile[] = this.mapFloor.getTilesWithinWorldXY(enemyPosition.x, enemyPosition.y, 16, 16);
      const playerTiles: Phaser.Tilemaps.Tile[] = this.mapFloor.getTilesWithinWorldXY(playerPosition.x, playerPosition.y, 16, 16);
      const enemyTile = enemyTiles[0];
      const playerTile = playerTiles[0];

      const path = pfFinder.findPath(enemyTile.x, enemyTile.y, playerTile.x, playerTile.y, pfGrid);
      return path;
    } catch (e) {
      console.log('error finding path', e);
      return [];
    }
  }

  createRenderTexture(width: number, height: number) {
    const rt = this.add.renderTexture(
      width / 2,
      height / 2,
      width,
      height
    ).setPipeline('Light2D');
    return rt;
  }

  createInput() {
    // @ts-ignore
    this.keyN = this.input.keyboard ? this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N) : {};
  }

  spawnEnemies() {
    const spawnPointEnemies = this.map.filterObjects(
      "Objects",
      (obj) => obj.name === ENEMY
    );
    if (!spawnPointEnemies?.length) {
      return
    }
    const spawnPointEnemy = spawnPointEnemies[Phaser.Math.Between(0, spawnPointEnemies?.length - 1)];
    this.enemyId++;
    // @ts-ignore
    const enemy = new Enemy(this, spawnPointEnemy.x, spawnPointEnemy.y, this.mapWalls, this.mapFloor, this.enemyId);
    this.enemies.push(enemy);
  }
  createHorrifyFx() {
    return;
    const horrifySettings = {
      vhsStrength: 0.05,
      scanlineStrength: 0.1,
      // better vignette
      vignetteStrength: 5,
      vignetteIntensity: 0.5,
      // NYI below here...
      bloomIntensity: 0.5,
      crtSize: this.game.config.width,
      // chromatic abberation
      chabIntensity: 0.2,
    }
    // @ts-ignore
    this.camera.setPostPipeline(HorrifiPostFx);
    const pipeline = this.camera.getPostPipeline(HorrifiPostFx);
    // @ts-ignore
    window.pp = pipeline;

    // @ts-ignore
    pipeline.setScanlinesEnable(true);
    // @ts-ignore
    pipeline.setScanStrength(horrifySettings.scanlineStrength);

    let scanlineTime = 0;
    this.time.addEvent({
      delay: 50,
      // @ts-ignore
      callback: () => {
        scanlineTime += 50;
        // @ts-ignore
        pipeline.setScanStrength(0.025 + horrifySettings.scanlineStrength + Math.sin(scanlineTime / 100) * 0.025)
      },
      loop: true
    });

    // @ts-ignore
    pipeline.setVHSEnable(true);
    // @ts-ignore
    pipeline.setVhsStrength(horrifySettings.vhsStrength);
    // console.log(this.camera.getPostPipeline(HorrifiPostFx));

    // @ts-ignore
    pipeline.setVignetteEnable(true);
    // @ts-ignore
    pipeline.setVignetteStrength(horrifySettings.vignetteStrength);
    // @ts-ignore
    pipeline.setVignetteIntensity(horrifySettings.vignetteIntensity);


    // @ts-ignore
    pipeline.setCRTEnable(true);
    // @ts-ignore
    pipeline.setCrtSize(horrifySettings.crtSize);
  }

  createLights() {
    this.lights.enable();

    //this.lights.setAmbientColor(0x808080);
    this.lights.setAmbientColor(FLOOR_LIGHT_TINT.color);

    this.light = this.createLight();
    this.light.setPosition(300, 300);
    // @ts-ignore
    // window.ll = this.light;
  }

  public createLight(): Phaser.GameObjects.Light {
    const light = this.lights.addLight(0, 0, FLOOR_LIGHT_TINT.radius);
    light.setIntensity(FLOOR_LIGHT_TINT.intensity);

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
        circle: true,
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
    // console.log(this.mapWalls);
    // window.gl = this.mapWalls.setCollisionByProperty({ collides: true });
    //this.groundLayer.tileset

    // 600 tiles???
    let array = Array.from({ length: 600 }, (_, i) => i + 1);

    // @ts-ignore
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
    this.ray.setCollisionRange(INNER_CIRCLE_RADIUS);

    //draw rays
    this.drawIntersections();
    // //get objects in field of view
    // visibleObjects = this.ray.overlap(group.getChildren());




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
    //this.fow.setPipeline("Light2D");
  }

  // drunk effect
  rotateCamera(delta: number) {
    // take player movement into account. vectors?
    // hotline miami style https://www.youtube.com/watch?v=hT-dyANbHDY
    const isMoving = this.player.sprite.body.velocity.length();
    if (isMoving) {
      this.rotateCameraTime += delta;
      const rotation = Math.sin(this.rotateCameraTime / 3000) * 0.01 * Math.PI;
      this.camera.setRotation(rotation);
    }
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);

    this.sound.listenerPosition.set(this.player.sprite.x, this.player.sprite.y);
    this.enemies.forEach((enemy) => enemy.update(time, delta))
    if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
      ;
      this.spawnEnemies();
    }
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

    // check if object is in field of view and inside ring
    this.enemies.forEach((enemyObj) => {
      const allObjects = this.ray.overlap();
      allObjects.forEach((obj: Phaser.GameObjects.GameObject) => {
        if (obj === enemyObj.sprite) {
          //console.log('OVERLAP');
          //if (enemyObj.sprite.alpha < 1) {
          //this.tweens.killTweensOf(enemyObj.sprite);
          enemyObj.sprite.setAlpha(1);
          enemyObj.startFlyingTowardsPlayer();
          //}
        } else {
          //console.log('NO OVERLAP');
          // if (enemyObj.sprite.alpha >= 0.0) {
          //   // this.tweens.add({
          //   //   targets: enemyObj.sprite,
          //   //   alpha: 0,
          //   //   duration: 5000,
          //   //   ease: 'Power2'
          //   // });
          //   enemyObj.sprite.setAlpha(.5);
          // }


          enemyObj.startWalking();
        }

      })
      // const visibleObjects = this.ray.overlap(enemyObj.sprite);
      // if (visibleObjects.length) {
      //   // inner ring!
      //   // fly towards player
      //   enemyObj.startFlyingTowardsPlayer();
      // }
    })
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
    this.light.setColor(FLOOR_LIGHT_TINT.lightColor);

    // cast rays in a cone
    this.intersections = this.ray.castCone();
    // add player position (to paint the full thing)

    //this.intersections.push({ x: this.player.sprite.x, y: this.player.sprite.y })
    // Assume you have a starting point (x, y), a distance d, and an angle in radians.
    let x = this.player.sprite.x;
    let y = this.player.sprite.y;
    let d = -8; // replace with your desired distance
    let angle = this.player.sprite.rotation; // your starting angle

    // Calculate points at 90 degrees to the left and right
    let leftAngle = angle - Math.PI / 2; // 90 degrees to the left
    let rightAngle = angle + Math.PI / 2; // 90 degrees to the right

    // Calculate the new points
    let leftPoint = new Phaser.Geom.Point(
      x + d * Math.cos(leftAngle),
      y + d * Math.sin(leftAngle)
    );
    let rightPoint = new Phaser.Geom.Point(
      x + d * Math.cos(rightAngle),
      y + d * Math.sin(rightAngle)
    );

    // geometry,
    this.intersections.push({ x: leftPoint.x, y: leftPoint.y })
    this.intersections.push({ x: rightPoint.x, y: rightPoint.y })

    // redraw
    this.drawIntersections();
  }
}
