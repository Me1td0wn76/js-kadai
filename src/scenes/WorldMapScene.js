import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { BaseScene } from './SceneManager.js';
import { PlayerIcon } from '../entities/PlayerIcon.js';
import { ImageLoader } from '../assets/ImageLoader.js';

export class WorldMapScene extends BaseScene {
    constructor(sceneManager, transitionData = {}) {
        super(sceneManager, transitionData);
        this.player = null;
        this.worldMap = null;
        this.camera = { x: 0, y: 0 };
        this.areas = [];
        this.playerSpeed = 3;
        this.encounterRate = 0.02; // エンカウント率
        this.stepCount = 0;
        this.imageLoader = null;
    }
    
    async init() {
        this.container = new PIXI.Container();
        
        // ImageLoaderを初期化
        this.imageLoader = new ImageLoader();
        await this.imageLoader.loadAllAssets();
        
        // デバッグ用：テクスチャサイズを表示
        this.imageLoader.logAllTextureSizes();
        
        // 背景とワールドマップを作成
        await this.createWorldMap();
        
        // プレイヤーを作成
        this.createPlayer();
        
        // エリア（ダンジョン入口）を作成
        this.createAreas();
        
        // UI要素を作成
        this.createUI();
        
        // カメラの初期設定
        this.setupCamera();
        
        console.log('ワールドマップシーンが初期化されました');
    }
    
    async createWorldMap() {
        // 世界地図の背景
        this.worldMap = new PIXI.Container();
        
        // シンプルな草原色の背景
        const grassBackground = new PIXI.Graphics();
        grassBackground.rect(0, 0, 1600, 1200);
        grassBackground.fill(0x4a7c59); // 草原の緑色
        this.worldMap.addChild(grassBackground);
        
        // マップタイル（添付された緑のブロック画像）を配置
        this.createMapTiles();
        
        // 簡単な装飾要素のみ追加
        this.createSimpleDecorations();
        
        this.container.addChild(this.worldMap);
    }
    
    createSimpleDecorations() {
        // 少数の装飾的な要素のみ配置
        
        // 道を表現する簡単なライン
        const road = new PIXI.Graphics();
        road.stroke({ width: 6, color: 0x8b7355 });
        road.moveTo(100, 600);
        road.lineTo(800, 600);
        road.lineTo(800, 300);
        road.lineTo(1200, 300);
        this.worldMap.addChild(road);
        
        // 森を表現する簡単な円（少数）
        const forests = new PIXI.Graphics();
        forests.fill(0x2d5016);
        
        // 3つの森エリア
        const forestAreas = [
            { x: 250, y: 150, radius: 60 },
            { x: 1050, y: 600, radius: 50 },
            { x: 150, y: 800, radius: 40 }
        ];
        
        forestAreas.forEach(forest => {
            forests.circle(forest.x, forest.y, forest.radius);
        });
        
        this.worldMap.addChild(forests);
    }
    
    createPlayer() {
        const gameData = this.getGameData();
        
        // PlayerIconクラスを使用（ImageLoaderを渡す）
        this.playerIcon = new PlayerIcon(this.imageLoader);
        this.player = this.playerIcon.container;
        
        // 位置を設定
        this.player.x = gameData.player?.position?.x || 400;
        this.player.y = gameData.player?.position?.y || 300;
        
        this.worldMap.addChild(this.player);
        
        // プレイヤーのアニメーション
        gsap.to(this.player.scale, {
            x: 1.1,
            y: 1.1,
            duration: 1,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1
        });
    }
    
    createAreas() {
        // ダンジョンエリアアイコンを画像で作成
        const areas = [
            {
                name: '古の遺跡',
                x: 400,
                y: 500,
                dungeonName: '古の遺跡',
                difficulty: 1,
                iconType: 'stairs',
                type: 'dungeon' // 追加
            },
            {
                name: '溶岩洞窟',
                x: 800,
                y: 300,
                dungeonName: '溶岩洞窟',
                difficulty: 2,
                iconType: 'lava',
                type: 'dungeon' // 追加
            },
            {
                name: '闇の神殿',
                x: 1200,
                y: 600,
                dungeonName: '闇の神殿',
                difficulty: 3,
                iconType: 'grave',
                type: 'dungeon' // 追加
            },
            {
                name: '魔法の塔',
                x: 600,
                y: 200,
                dungeonName: '魔法の塔',
                difficulty: 2,
                iconType: 'house',
                type: 'dungeon' // 追加
            }
        ];
        
        areas.forEach(areaData => {
            this.createAreaIcon(areaData);
        });
        
        // 宝箱やアイテムも配置
        this.createTreasureChests();
    }

    createAreaIcon(areaData) {
        let areaIcon;
        
        // 画像アイコンを使用
        let iconTexture = null;
        switch (areaData.iconType) {
            case 'stairs':
                iconTexture = this.imageLoader.getTexture('tile_stairs');
                break;
            case 'lava':
                iconTexture = this.imageLoader.getTexture('tile_lava');
                break;
            case 'grave':
                iconTexture = this.imageLoader.getTexture('tile_grave');
                break;
            case 'house':
                iconTexture = this.imageLoader.getTexture('tile_house');
                break;
        }
        
        if (iconTexture) {
            areaIcon = new PIXI.Sprite(iconTexture);
            areaIcon.width = 80;
            areaIcon.height = 80;
            areaIcon.anchor.set(0.5);
        } else {
            // フォールバック
            areaIcon = new PIXI.Graphics();
            const colors = {
                stairs: 0x808080,
                lava: 0xff4500,
                grave: 0x2f4f4f,
                house: 0x8b4513
            };
            areaIcon.rect(-40, -40, 80, 80);
            areaIcon.fill(colors[areaData.iconType] || 0x808080);
        }
        
        areaIcon.x = areaData.x;
        areaIcon.y = areaData.y;
        areaIcon.interactive = true;
        areaIcon.buttonMode = true;
        
        // エリア名ラベル
        const label = new PIXI.Text(areaData.name, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'center'
        });
        label.anchor.set(0.5);
        label.x = areaData.x;
        label.y = areaData.y + 50;
        
        // アニメーション
        gsap.to(areaIcon, {
            y: areaIcon.y - 10,
            duration: 2,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1
        });
        
        areaIcon.userData = areaData;
        
        this.worldMap.addChild(areaIcon);
        this.worldMap.addChild(label);
        this.areas.push(areaIcon);
    }

    createTreasureChests() {
        const treasurePositions = [
            { x: 300, y: 400 },
            { x: 900, y: 500 },
            { x: 1100, y: 200 },
            { x: 500, y: 800 }
        ];
        
        treasurePositions.forEach(pos => {
            const treasureTexture = this.imageLoader.getTexture('treasure_chest');
            let treasure;
            
            if (treasureTexture) {
                treasure = new PIXI.Sprite(treasureTexture);
                treasure.anchor.set(0.5);
                treasure.scale.set(0.3); // 宝箱のサイズを小さく（0.8から0.3に）
            } else {
                // フォールバック
                treasure = new PIXI.Graphics();
                treasure.rect(-10, -8, 20, 15); // フォールバックサイズも小さく
                treasure.fill(0xffd700);
            }
            
            treasure.x = pos.x;
            treasure.y = pos.y;
            treasure.interactive = true;
            
            // キラキラエフェクト
            gsap.to(treasure, {
                alpha: 0.7,
                duration: 1,
                ease: "power2.inOut",
                yoyo: true,
                repeat: -1
            });
            
            this.worldMap.addChild(treasure);
        });
    }
    
    createUI() {
        // UI要素をHTMLで作成
        const uiContainer = document.createElement('div');
        uiContainer.id = 'worldmap-ui';
        uiContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        `;
        
        const gameData = this.getGameData();
        uiContainer.innerHTML = `
            <div><strong>ワールドマップ</strong></div>
            <div>レベル: ${gameData.player.level}</div>
            <div>HP: ${gameData.player.hp}/${gameData.player.maxHp}</div>
            <div>MP: ${gameData.player.mp}/${gameData.player.maxMp}</div>
            <div style="margin-top: 10px; font-size: 12px;">
                移動: 矢印キー<br>
                エリア侵入: Enterキー
            </div>
        `;
        
        document.body.appendChild(uiContainer);
    }
    
    setupCamera() {
        if (!this.player) {
            console.error('プレイヤーが作成されていません');
            return;
        }
        // カメラの初期位置を設定
        this.camera.x = -this.player.x + 400;
        this.camera.y = -this.player.y + 300;
        this.worldMap.x = this.camera.x;
        this.worldMap.y = this.camera.y;
        this.updateCamera();
    }
    
    updateCamera() {
        if (!this.player) return;
        
        // カメラをプレイヤーに追従
        const targetX = -this.player.x + 400;
        const targetY = -this.player.y + 300;
        
        gsap.to(this.camera, {
            x: targetX,
            y: targetY,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => {
                this.worldMap.x = this.camera.x;
                this.worldMap.y = this.camera.y;
            }
        });
    }
    
    update(delta) {
        // プレイヤーが作成されてからのみ更新処理を実行
        if (this.player) {
            this.handleMovement();
            this.checkAreaCollisions();
            this.checkRandomEncounters();
        }
    }
    
    handleInput(input) {
        this.keys = input;
    }
    
    handleMovement() {
        let moved = false;
        const speed = this.playerSpeed;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y -= speed;
            this.playerIcon.setDirection('up');
            moved = true;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y += speed;
            this.playerIcon.setDirection('down');
            moved = true;
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x -= speed;
            this.playerIcon.setDirection('left');
            moved = true;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x += speed;
            this.playerIcon.setDirection('right');
            moved = true;
        }
        
        if (moved) {
            this.stepCount++;
            if (this.playerIcon && this.playerIcon.setAnimationState) {
                this.playerIcon.setAnimationState('walking');
            }
            this.updateCamera();
            
            // プレイヤー位置を保存
            const gameData = this.getGameData();
            gameData.player = gameData.player || {};
            gameData.player.position = { x: this.player.x, y: this.player.y };
            this.updateGameData(gameData);
        } else {
            if (this.playerIcon && this.playerIcon.setAnimationState) {
                this.playerIcon.setAnimationState('idle');
            }
        }
        
        // 境界チェック
        if (this.player) {
            this.player.x = Math.max(50, Math.min(1550, this.player.x));
            this.player.y = Math.max(50, Math.min(1150, this.player.y));
        }
    }
    
    checkAreaCollisions() {
        this.areas.forEach(area => {
            const distance = Math.sqrt(
                Math.pow(this.player.x - area.x, 2) + 
                Math.pow(this.player.y - area.y, 2)
            );
            
            if (distance < 40) {
                // エリアに近づいた時の処理
                if (this.keys['Enter'] || this.keys['Space']) {
                    this.enterArea(area.userData); // 修正: area.areaData → area.userData
                }
                
                // 近づいた時の視覚的フィードバック
                area.alpha = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
            } else {
                area.alpha = 1;
            }
        });
    }
    
    checkRandomEncounters() {
        // ランダムエンカウントチェック
        if (this.stepCount > 0 && this.stepCount % 30 === 0) {
            if (Math.random() < this.encounterRate) {
                this.triggerRandomEncounter();
            }
        }
    }
    
    enterArea(areaData) {
        console.log(`${areaData.name}に入ります`);
        
        if (areaData.type === "dungeon") {
            // ダンジョンシーンに切り替え
            this.switchTo('dungeon', {
                dungeonName: areaData.name,
                dungeonType: areaData.name
            });
        } else if (areaData.type === "town") {
            // 街シーンに切り替え（後で実装）
            console.log('街の実装は後で行います');
        }
    }
    
    triggerRandomEncounter() {
        console.log('ランダムエンカウント発生！');
        
        // フィールドで出現する敵の種類を重み付きで選択（トロール以外を優先）
        const fieldEnemies = [
            { type: 'troll', name: 'トロール', level: 1, weight: 1 },
            { type: 'skeleton', name: 'スケルトン', level: 2, weight: 4 },
            { type: 'dragon_red', name: 'レッドドラゴン', level: 3, weight: 2 },
            { type: 'dragon_blue', name: 'ブルードラゴン', level: 2, weight: 3 }
        ];
        
        // 重み付きランダム選択
        const totalWeight = fieldEnemies.reduce((sum, enemy) => sum + enemy.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        let selectedEnemy = fieldEnemies[0]; // デフォルト
        
        for (const enemy of fieldEnemies) {
            randomWeight -= enemy.weight;
            if (randomWeight <= 0) {
                selectedEnemy = enemy;
                break;
            }
        }
        
        // 戦闘シーンに切り替え
        this.switchTo('battle', {
            enemy: {
                name: selectedEnemy.name,
                level: selectedEnemy.level + Math.floor(Math.random() * 2),
                enemyType: selectedEnemy.type
            },
            battleBackground: 'field'
        });
    }
    
    createMapTiles() {
        const tileSize = 64;
        const mapWidth = 25;
        const mapHeight = 19;
        
        // 基本的に草原タイル（添付された緑のブロック画像）を使用
        const grassTexture = this.imageLoader.getTexture('tile_grass');
        
        // まず全体を草原タイルで埋める
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                this.createBaseTile(x * tileSize, y * tileSize, grassTexture);
            }
        }
        
        // 少数の装飾タイルを配置（全体の10%程度）
        const decorativeTiles = ['house', 'stairs', 'stone'];
        const decorationCount = Math.floor((mapWidth * mapHeight) * 0.1);
        
        for (let i = 0; i < decorationCount; i++) {
            const x = Math.floor(Math.random() * mapWidth) * tileSize;
            const y = Math.floor(Math.random() * mapHeight) * tileSize;
            const tileType = decorativeTiles[Math.floor(Math.random() * decorativeTiles.length)];
            this.createDecorationTile(x, y, tileType);
        }
    }

    createBaseTile(x, y, texture) {
        if (texture) {
            const tile = new PIXI.Sprite(texture);
            tile.x = x;
            tile.y = y;
            tile.width = 64;
            tile.height = 64;
            this.worldMap.addChild(tile);
        } else {
            // フォールバック：草原色の四角形
            const fallbackTile = new PIXI.Graphics();
            fallbackTile.rect(x, y, 64, 64);
            fallbackTile.fill(0x4a7c59); // 草原色
            this.worldMap.addChild(fallbackTile);
        }
    }

    createDecorationTile(x, y, tileType) {
        let texture = null;
        
        switch (tileType) {
            case 'house':
                texture = this.imageLoader.getTexture('tile_house');
                break;
            case 'stairs':
                texture = this.imageLoader.getTexture('tile_stairs');
                break;
            case 'stone':
                texture = this.imageLoader.getTexture('tile_stone');
                break;
        }
        
        if (texture) {
            const tile = new PIXI.Sprite(texture);
            tile.x = x;
            tile.y = y;
            tile.width = 64;
            tile.height = 64;
            tile.alpha = 0.9; // 少し透明にして背景と馴染ませる
            this.worldMap.addChild(tile);
        }
    }
    
    destroy() {
        super.destroy();
        
        // UIを削除
        const ui = document.getElementById('worldmap-ui');
        if (ui) {
            ui.remove();
        }
    }
}
