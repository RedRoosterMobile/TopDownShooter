import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';

import { Game, Types } from "phaser";

import PhaserRaycaster from 'phaser-raycaster'
import HorrifiPipelinePlugin from 'phaser3-rex-plugins/plugins/horrifipipeline-plugin.js';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';

// import BoardPlugin from 'phaser3-rex-plugins/plugins/board-plugin.js';

import HorrifiPostFx from 'phaser3-rex-plugins/plugins/horrifipipeline.js';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  autoRound: false,
  antialiasGL: false,
  parent: 'game-container',
  //backgroundColor: '#028af8',
  //backgroundColor: '#00ff00',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    Boot,
    Preloader,
    MainMenu,
    MainGame,
    GameOver
  ],

  // @ts-ignore
  pipeline: [HorrifiPostFx],
  plugins: {
    global: [

     ],
    // https://wiserim.github.io/phaser-raycaster/
    scene: [
      {
        key: 'PhaserRaycaster',
        plugin: PhaserRaycaster,
        mapping: 'raycasterPlugin'
      },
      {
        key: 'rexHorrifiPipeline',
        plugin: HorrifiPipelinePlugin,
        start: true
      }
      ,
      {
        key: 'rexVirtualJoystick',
        plugin: VirtualJoystickPlugin,
        start: true
      }
      // {
      //     key: 'rexBoard',
      //     plugin: BoardPlugin,
      //     mapping: 'rexBoard'
      // },
    ]
  }
};

const game = new Game(config);


let orientationChangeCounter = 0;

function requireOrientation(orientation: string) {
  // Create the overlay element
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.color = 'white';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';
  overlay.innerHTML = `<p>Please rotate your device to ${orientation}.</p>`;
  document.body.appendChild(overlay);

  // Function to check orientation
  const checkOrientation = () => {

    console.log(orientationChangeCounter);
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    if ((isPortrait && orientation === 'portrait') || (!isPortrait && orientation === 'landscape')) {
      overlay.style.display = 'none';
      // still show overlay if not 0
      if (orientationChangeCounter != 0) {
        overlay.innerHTML = '<button onclick="location.reload()">Reload to refresh</button>';
        overlay.style.display = 'flex';
      } else {
        game && game.resume();
      }
    } else {
      overlay.style.display = 'flex';
      game && game.pause();
      // @ts-ignore
      window.gg = game;
    }
    orientationChangeCounter++;
  };

  // Check orientation initially
  checkOrientation();

  // Listen for orientation changes
  window.addEventListener('resize', checkOrientation);
}

// Usage
requireOrientation('landscape'); // replace 'portrait' with 'landscape' for landscape mode

export default game;