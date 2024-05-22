import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';

import { Game, Types } from "phaser";

import PhaserRaycaster from 'phaser-raycaster'
import HorrifiPipelinePlugin from 'phaser3-rex-plugins/plugins/horrifipipeline-plugin.js';

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
    backgroundColor: '#00ff00',
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
        global: [{
            key: 'rexHorrifiPipeline',
            plugin: HorrifiPipelinePlugin,
            start: true
        }],
        // https://wiserim.github.io/phaser-raycaster/
        scene: [
            {
                key: 'PhaserRaycaster',
                plugin: PhaserRaycaster,
                mapping: 'raycasterPlugin'
            }
        ]
    }
};

export default new Game(config);
