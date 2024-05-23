import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, 'background');

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);


    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {

      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + (460 * progress);

    });
  }

  
  noSpatial() {
    console.log('nospacial');
//    var url = 'assets/music.m4a';
    var url ='assets/audio/gemattack-maintheme.m4a';

    /* --- set up web audio --- */
    //create the context
    var context = new AudioContext();
    //...and the source
    var source = context.createBufferSource();
    //connect it to the destination so you can hear it.
    source.connect(context.destination);

    /* --- load buffer ---  */
    var request = new XMLHttpRequest();
    //Once the request has completed... do this
    request.onload = function () {
      console.log('loaded');
      context.decodeAudioData(request.response, function (response) {
        /* --- play the sound AFTER the buffer loaded --- */
        //set the buffer to the response we just received.
        source.buffer = response;
        //start(0) should play asap.
        source.start(0);
        source.loop = true;
      }, function () { console.error('The request failed.'); });
    }
    //webaudio paramaters
    request.responseType = 'arraybuffer';
    //open the request
    request.open('GET', url, true);
    
    
  }

  preload() {
    
    
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath('assets');


    this.load.image('logo', 'logo.png');


    //this.load.audio('music','music.m4a');
    // this.load.audio('zombie','audio/zombie.m4a');
    this.load.audioSprite('zombies', 'audio/zombies.json', 'audio/zombies.m4a');
    this.load.audio("explodeBody", "audio/sndGoreSplash.mp3");
    this.load.audio("shells", "audio/sndShells.m4a");
    this.load.audio("shoot", "audio/sndFireBass.wav");
    this.load.audio("explosion", "audio/sndExplosion.wav");

    // load tilemaps / sets and level
    this.load.image(
      "tiles",
      "tiled/CosmicLilac_Tiles.png"
    );

    this.load.tilemapTiledJSON("map", "tiled/level_01.tmj");


    // player

    this.load.image('player', 'player.png')


    // bullets and stuff
    this.load.atlas(
      "sprites",
      "sprites.png",
      "sprites.json"
    );

    // legs only
    this.load.atlas(
      "legs",
      "legs.png",
      "legs.json"
    );

    //enemy
    this.load.atlas(
      "enemy",
      "enemy.png",
      "enemy.json"
    );
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu');
  }
}
