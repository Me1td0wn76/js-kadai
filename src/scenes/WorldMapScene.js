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
        
        // 背景画像を使用（haikei.png）
        const backgroundTexture = this.imageLoader.getTexture('background');
        if (backgroundTexture) {
            const backgroundSprite = new PIXI.Sprite(backgroundTexture);
            // 画像をマップサイズにスケール
            backgroundSprite.width = 1600;
            backgroundSprite.height = 1200;
            this.worldMap.addChild(backgroundSprite);
        } else {
            // フォールバック：草原のベース
            const grassBackground = new PIXI.Graphics();
            grassBackground.rect(0, 0, 1600, 1200);
            grassBackground.fill(0x4a7c59);
            this.worldMap.addChild(grassBackground);
        }
        
        // 道路を描画
        this.createRoads();
        
        // 森林地帯
        this.createForests();
        
        // 山岳地帯
        this.createMountains();
        
        // 水辺
        this.createWaterBodies();
        
        this.container.addChild(this.worldMap);
    }
    
    createRoads() {
        const roads = new PIXI.Graphics();
        roads.stroke({ width: 8, color: 0x8b7355 });
        
        // メイン道路
        roads.moveTo(100, 600);
        roads.lineTo(800, 600);
        roads.lineTo(800, 300);
        roads.lineTo(1200, 300);
        
        // 支線道路
        roads.moveTo(400, 600);
        roads.lineTo(400, 900);
        roads.moveTo(800, 600);
        roads.lineTo(1000, 800);
        
        this.worldMap.addChild(roads);
    }
    
    createForests() {
        const forests = new PIXI.Graphics();
        
        // 森林エリア
        for (let i = 0; i < 15; i++) {
            const x = 200 + Math.random() * 300;
            const y = 100 + Math.random() * 200;
            const radius = 30 + Math.random() * 20;
            forests.circle(x, y, radius);
        }
        
        // 別の森林エリア
        for (let i = 0; i < 10; i++) {
            const x = 1000 + Math.random() * 200;
            const y = 500 + Math.random() * 300;
            const radius = 25 + Math.random() * 15;
            forests.circle(x, y, radius);
        }
        
        forests.fill(0x2d5016);
        this.worldMap.addChild(forests);
    }
    
    createMountains() {
        const mountains = new PIXI.Graphics();
        
        // 山脈
        for (let i = 0; i < 8; i++) {
            const x = 1200 + i * 60;
            const y = 150 + Math.random() * 100;
            
            // 三角形の山
            mountains.moveTo(x, y + 80);
            mountains.lineTo(x + 30, y);
            mountains.lineTo(x + 60, y + 80);
            mountains.closePath();
        }
        
        mountains.fill(0x5d4037);
        this.worldMap.addChild(mountains);
    }
    
    createWaterBodies() {
        const water = new PIXI.Graphics();
        
        // 湖
        water.ellipse(600, 200, 80, 50);
        water.fill(0x1565c0);
        
        // 川
        for (let i = 0; i < 20; i++) {
            const x = 500 + i * 30;
            const y = 950 + Math.sin(i * 0.5) * 20;
            water.circle(x, y, 15);
        }
        water.fill(0x1976d2);
        
        this.worldMap.addChild(water);
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
        // ダンジョンエリアを配置
        const areaData = [
            { x: 300, y: 300, name: "古い遺跡", type: "dungeon", color: 0x795548 },
            { x: 700, y: 150, name: "魔の森", type: "dungeon", color: 0x2e7d32 },
            { x: 1100, y: 400, name: "火山洞窟", type: "dungeon", color: 0xd84315 },
            { x: 500, y: 800, name: "水の神殿", type: "dungeon", color: 0x1565c0 },
            { x: 200, y: 700, name: "街", type: "town", color: 0xffa726 }
        ];
        
        areaData.forEach(area => {
            const areaSprite = new PIXI.Graphics();
            
            if (area.type === "dungeon") {
                // ダンジョンのアイコン
                areaSprite.rect(-15, -15, 30, 30);
                areaSprite.fill(area.color);
                
                areaSprite.rect(-10, -10, 20, 20);
                areaSprite.fill(0x000000);
            } else if (area.type === "town") {
                // 街のアイコン
                areaSprite.circle(0, 0, 20);
                areaSprite.fill(area.color);
                
                areaSprite.circle(0, 0, 15);
                areaSprite.fill(0xffffff);
            }
            
            areaSprite.x = area.x;
            areaSprite.y = area.y;
            areaSprite.interactive = true;
            areaSprite.buttonMode = true;
            
            // エリア情報を保存
            areaSprite.areaData = area;
            
            // ホバー効果
            areaSprite.on('pointerover', () => {
                gsap.to(areaSprite.scale, {
                    x: 1.2,
                    y: 1.2,
                    duration: 0.2,
                    ease: "back.out(1.7)"
                });
            });
            
            areaSprite.on('pointerout', () => {
                gsap.to(areaSprite.scale, {
                    x: 1,
                    y: 1,
                    duration: 0.2,
                    ease: "back.out(1.7)"
                });
            });
            
            this.worldMap.addChild(areaSprite);
            this.areas.push(areaSprite);
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
                    this.enterArea(area.areaData);
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
        
        // 戦闘シーンに切り替え
        this.switchTo('battle', {
            enemyType: 'random',
            battleBackground: 'field'
        });
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
