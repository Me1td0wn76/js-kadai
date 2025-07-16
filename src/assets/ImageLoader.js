import * as PIXI from 'pixi.js';
import * as THREE from 'three';

export class ImageLoader {
    constructor() {
        this.textures = new Map();
        this.isLoaded = false;
    }

    async loadAllAssets() {
        try {
            console.log('画像アセット読み込み開始...');

            // 背景・マップタイル画像
            await this.loadAsset('background', '/src/images/worldmap/haikei.png');
            await this.loadAsset('tile_grass', '/src/images/worldmap/maptile_sogen_01.png');
            await this.loadAsset('tile_lava', '/src/images/worldmap/maptile_yogan.png');
            await this.loadAsset('tile_poison', '/src/images/worldmap/maptile_dokunuma.png');
            await this.loadAsset('tile_house', '/src/images/worldmap/maptile_koya.png');
            await this.loadAsset('tile_carpet_blue', '/src/images/worldmap/maptile_carpet_blue_bottom_right.png');
            await this.loadAsset('tile_carpet_red', '/src/images/worldmap/maptile_carpet_red_top_right.png');
            await this.loadAsset('tile_stairs', '/src/images/worldmap/kaidan_front_02_stone.png');
            await this.loadAsset('tile_stone', '/src/images/worldmap/ishi.png');
            await this.loadAsset('tile_grave', '/src/images/worldmap/haka_02.png');

            // プレイヤーキャラクター画像
            await this.loadAsset('player', '/src/images/character/human1.png');
            await this.loadAsset('player_scientist', '/src/images/dr_mirela_cientist.png');
            await this.loadAsset('player_sprite', '/src/images/sprite.png');
            await this.loadAsset('player_warrior', '/src/images/character/character_senshi_blue.png');
            await this.loadAsset('player_mage', '/src/images/character/character_mahotsukai_02_green.png');
            await this.loadAsset('player_priest', '/src/images/character/character_shinpu_purple.png');

            // 敵キャラクター画像
            await this.loadAsset('troll', '/src/images/trool_idlewalk_atack_die.png');
            await this.loadAsset('enemy_dragon_red', '/src/images/character/character_monster_dragon_02_red.png');
            await this.loadAsset('enemy_dragon_blue', '/src/images/character/character_monster_dragon_03_blue.png');
            await this.loadAsset('enemy_skeleton', '/src/images/character/character_monster_skeleton_01.png');
            await this.loadAsset('enemy_dark_angel', '/src/images/character/character_datenshi_02_02_black.png');
            await this.loadAsset('enemy_dark_mage', '/src/images/character/character_madoshi_02_black.png');

            // アイテム・装備画像
            await this.loadAsset('armor_green', '/images/armor_green.png');
            await this.loadAsset('armor_belt', '/images/armor_koshiate_green.png');
            await this.loadAsset('sword_bronze', '/images/tsurugi_bronze_green.png');
            await this.loadAsset('shield_set', '/images/spriteShieldsLevel_strip4.png');
            await this.loadAsset('ring_gold', '/images/ring_gold_blue.png');
            await this.loadAsset('crystal_red', '/images/crystal_red.png');
            await this.loadAsset('jewelry_pink', '/images/jewelry_round_pink.png');

            // ポーション・消耗品
            await this.loadAsset('potion_orange', '/images/portion_02_orange.png');
            await this.loadAsset('potion_purple', '/images/portion_02_purple_01.png');
            await this.loadAsset('poison_green', '/images/doku_green.png');
            await this.loadAsset('poison_purple', '/images/doku_purple.png');

            // エフェクト・装飾
            await this.loadAsset('fire_effect', '/images/hinotama_orange.png');
            await this.loadAsset('sparkle_blue', '/images/kirakira_01_blue.png');
            await this.loadAsset('sparkle_green', '/images/kirakira_01_green.png');
            await this.loadAsset('treasure_chest', '/images/treasure_red_gold.png');
            await this.loadAsset('bookshelf', '/images/shelf_hondana_01.png');
            await this.loadAsset('custom_sprite', '/images/pixilart-drawing_1.png');

            // 汎用スプライト（後方互換性）
            await this.loadAsset('sprite', '/images/sprite.png');
            await this.loadAsset('scientist', '/images/dr_mirela_cientist.png');

            this.isLoaded = true;
            console.log('全画像アセット読み込み完了');

        } catch (error) {
            console.error('画像読み込みエラー:', error);
            console.log('フォールバック用テクスチャを作成します...');
            this.createFallbackTextures();
        }
    }

    async loadAsset(name, path) {
        try {
            const texture = await PIXI.Assets.load(path);
            this.textures.set(name, texture);
            console.log(`✓ ${name} 読み込み完了`);
        } catch (error) {
            console.warn(`⚠ ${name} (${path}) の読み込みに失敗:`, error.message);
        }
    }

    // Three.js用テクスチャを読み込む
    async loadThreeTexture(name, path) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                path,
                (texture) => {
                    this.textures.set(name, texture);
                    resolve(texture);
                },
                undefined,
                (err) => {
                    console.error('Three.jsテクスチャ読み込み失敗:', path);
                    reject(err);
                }
            );
        });
    }

    getThreeTexture(name) {
        return this.textures.get(name);
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

    // デバッグ用：テクスチャサイズを取得
    getTextureInfo(name) {
        const texture = this.getTexture(name);
        if (texture) {
            return {
                width: texture.width,
                height: texture.height,
                baseTexture: texture.baseTexture
            };
        }
        return null;
    }

    // デバッグ用：全テクスチャのサイズ情報を表示
    logAllTextureSizes() {
        console.log('=== テクスチャサイズ情報 ===');
        
        const categories = {
            'プレイヤー': ['player', 'player_scientist', 'player_warrior', 'player_mage', 'player_priest'],
            '敵': ['troll', 'enemy_dragon_red', 'enemy_dragon_blue', 'enemy_skeleton', 'enemy_dark_angel', 'enemy_dark_mage'],
            'マップタイル': ['tile_grass', 'tile_lava', 'tile_house', 'tile_stairs']
        };
        
        for (const [category, textures] of Object.entries(categories)) {
            console.log(`--- ${category} ---`);
            textures.forEach(name => {
                const info = this.getTextureInfo(name);
                if (info) {
                    console.log(`${name}: ${info.width}x${info.height}`);
                }
            });
        }
    }
}
