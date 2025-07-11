import * as PIXI from 'pixi.js';

export class ImageLoader {
    constructor() {
        this.textures = new Map();
        this.isLoaded = false;
    }

    async loadAllAssets() {
        try {
            console.log('画像アセット読み込み開始...');

            // 背景画像
            const backgroundTexture = await PIXI.Assets.load('/src/images/haikei.png');
            this.textures.set('background', backgroundTexture);

            // プレイヤーキャラクター
            const playerTexture = await PIXI.Assets.load('/src/images/human1.png');
            this.textures.set('player', playerTexture);

            // 科学者キャラクター
            const scientistTexture = await PIXI.Assets.load('/src/images/dr_mirela_cientist.png');
            this.textures.set('scientist', scientistTexture);

            // 敵キャラクター（トロール）
            const trollTexture = await PIXI.Assets.load('/src/images/trool_idlewalk_atack_die.png');
            this.textures.set('troll', trollTexture);

            // 汎用スプライト
            const spriteTexture = await PIXI.Assets.load('/src/images/sprite.png');
            this.textures.set('sprite', spriteTexture);

            this.isLoaded = true;
            console.log('画像アセット読み込み完了');

        } catch (error) {
            console.error('画像読み込みエラー:', error);
            this.createFallbackTextures();
        }
    }

    createFallbackTextures() {
        console.log('フォールバック用テクスチャを作成中...');
        
        // プレイヤー用フォールバック
        const playerGraphics = new PIXI.Graphics();
        playerGraphics.circle(0, 0, 16);
        playerGraphics.fill(0x3498db);
        const playerTexture = PIXI.RenderTexture.create({ width: 32, height: 32 });
        const renderer = PIXI.autoDetectRenderer();
        renderer.render(playerGraphics, { renderTexture: playerTexture });
        this.textures.set('player', playerTexture);

        // 背景用フォールバック
        const bgGraphics = new PIXI.Graphics();
        bgGraphics.rect(0, 0, 800, 600);
        bgGraphics.fill(0x87ceeb);
        const bgTexture = PIXI.RenderTexture.create({ width: 800, height: 600 });
        renderer.render(bgGraphics, { renderTexture: bgTexture });
        this.textures.set('background', bgTexture);

        // 敵用フォールバック
        const enemyGraphics = new PIXI.Graphics();
        enemyGraphics.circle(0, 0, 20);
        enemyGraphics.fill(0xff0000);
        const enemyTexture = PIXI.RenderTexture.create({ width: 40, height: 40 });
        renderer.render(enemyGraphics, { renderTexture: enemyTexture });
        this.textures.set('troll', enemyTexture);

        this.isLoaded = true;
    }

    getTexture(name) {
        return this.textures.get(name);
    }

    getAllTextures() {
        return this.textures;
    }

    // スプライトシートから特定の部分を切り出す
    createSubTexture(textureName, x, y, width, height) {
        const baseTexture = this.getTexture(textureName);
        if (!baseTexture) return null;

        const rectangle = new PIXI.Rectangle(x, y, width, height);
        return new PIXI.Texture(baseTexture.baseTexture, rectangle);
    }

    // アニメーション用のフレーム配列を作成
    createAnimationFrames(textureName, frameWidth, frameHeight, totalFrames, columns = 4) {
        const frames = [];
        const baseTexture = this.getTexture(textureName);
        
        if (!baseTexture) return frames;

        for (let i = 0; i < totalFrames; i++) {
            const x = (i % columns) * frameWidth;
            const y = Math.floor(i / columns) * frameHeight;
            
            const rectangle = new PIXI.Rectangle(x, y, frameWidth, frameHeight);
            const texture = new PIXI.Texture({
                source: baseTexture.source,
                frame: rectangle
            });
            frames.push(texture);
        }

        return frames;
    }
}
