export class TilePainter {
    private scene: Phaser.Scene
    private paintTextures: string

    constructor(scene: Phaser.Scene, paintTextures: string) {
        this.scene = scene
        this.paintTextures = paintTextures
    }

    // @ts-ignore
    paintTile(tile: Phaser.Tilemaps.Tile) {
        //let frameName = this.getFrameName(direction);
        //let paintSprite = this.scene.add.sprite(tile.pixelX, tile.pixelY, this.paintTextures, frameName);
        const randomImageNumber = Phaser.Math.Between(0, 3)

        const array = [0xaaaaaa, 0x99a9a9, 0x988888, 0x777777];
        const randomTint = Phaser.Utils.Array.GetRandom(array);


        let paintSprite = this.scene.add.image(tile.pixelX + Phaser.Math.Between(-1 / 16, 1 / 16), tile.pixelY + Phaser.Math.Between(0, 1 / 16), this.paintTextures, `tile_blood_16_${randomImageNumber}.png`).setTint(randomTint).setScale(1)

        if (randomImageNumber > 0) {
            //paintSprite.setOrigin(1, 0) // align the sprite with the top left of the tile
            const rotation = Phaser.Math.Between(0, 3);
            if (rotation == 0)
                paintSprite.setOrigin(0, 0)
            if (rotation == 1)
                paintSprite.setOrigin(0, 1)
            if (rotation == 2)
                paintSprite.setOrigin(1, 1)
            if (rotation == 3)
                paintSprite.setOrigin(1, 0)
            //paintSprite.setAngle(90 * rotation)

        } else {
            paintSprite.setOrigin(0, 0) // align the sprite with the top left of the tile
        }
        paintSprite.setAngle(Phaser.Math.FloatBetween(0, 360))
    }


}