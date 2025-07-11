import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Player } from './Player.js';
import { TilemapLoader } from './TilemapLoader.js';

export class Game {
    constructor() {
        this.app = null;
        this.player = null;
        this.tilemapLoader = null;
        this.tilemap = null;
        this.keys = {};
        this.score = 0;
        this.gameContainer = null;
        this.background = null;
        this.particles = [];
        
        this.init();
    }
    
    async init() {
        // PixiJSアプリケーションを作成
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x87CEEB,
            antialias: true
        });
        
        // HTMLにキャンバスを追加
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(this.app.view);
        
        // ゲームコンテナを作成
        this.gameContainer = new PIXI.Container();
        this.app.stage.addChild(this.gameContainer);
        
        // 背景を作成
        this.createBackground();
        
        // タイルマップを読み込み
        this.tilemapLoader = new TilemapLoader();
        this.tilemap = await this.tilemapLoader.loadMap('/src/assets/maps/level1.json');
        this.gameContainer.addChild(this.tilemap);
        
        // プレイヤーを作成
        this.player = new Player(100, 300);
        this.gameContainer.addChild(this.player.getSprite());
        
        // パーティクルシステムを初期化
        this.initParticleSystem();
        
        // イベントリスナーを設定
        this.setupEventListeners();
        
        // ゲームループを開始
        this.app.ticker.add(this.gameLoop.bind(this));
        
        // カメラの初期設定
        this.setupCamera();
        
        console.log('ゲームが開始されました！');
    }
    
    createBackground() {
        this.background = new PIXI.Container();
        
        // 雲を作成
        for (let i = 0; i < 8; i++) {
            const cloud = this.createCloud();
            cloud.x = Math.random() * 1200;
            cloud.y = 50 + Math.random() * 150;
            this.background.addChild(cloud);
            
            // 雲をゆっくり動かす
            gsap.to(cloud, {
                x: cloud.x + 200,
                duration: 20 + Math.random() * 10,
                ease: "none",
                repeat: -1,
                yoyo: true
            });
        }
        
        // 太陽を作成
        const sun = new PIXI.Graphics();
        sun.beginFill(0xFFD700);
        sun.drawCircle(0, 0, 40);
        sun.endFill();
        sun.x = 700;
        sun.y = 80;
        
        // 太陽の光線
        for (let i = 0; i < 8; i++) {
            const ray = new PIXI.Graphics();
            ray.lineStyle(3, 0xFFD700, 0.6);
            ray.moveTo(0, 0);
            ray.lineTo(60, 0);
            ray.rotation = (Math.PI * 2 / 8) * i;
            sun.addChild(ray);
        }
        
        // 太陽の回転アニメーション
        gsap.to(sun, {
            rotation: Math.PI * 2,
            duration: 20,
            ease: "none",
            repeat: -1
        });
        
        this.background.addChild(sun);
        this.gameContainer.addChild(this.background);
    }
    
    createCloud() {
        const cloud = new PIXI.Graphics();
        cloud.beginFill(0xFFFFFF, 0.8);
        
        // 雲の形を作成
        const baseX = 0;
        const baseY = 0;
        cloud.drawCircle(baseX, baseY, 20);
        cloud.drawCircle(baseX + 15, baseY, 25);
        cloud.drawCircle(baseX + 35, baseY, 20);
        cloud.drawCircle(baseX + 20, baseY - 15, 15);
        
        cloud.endFill();
        
        return cloud;
    }
    
    initParticleSystem() {
        // パーティクル用のコンテナ
        this.particleContainer = new PIXI.Container();
        this.gameContainer.addChild(this.particleContainer);
    }
    
    createParticle(x, y, color = 0xFFD700) {
        const particle = new PIXI.Graphics();
        particle.beginFill(color);
        particle.drawCircle(0, 0, 3 + Math.random() * 3);
        particle.endFill();
        
        particle.x = x;
        particle.y = y;
        
        this.particleContainer.addChild(particle);
        this.particles.push(particle);
        
        // パーティクルアニメーション
        gsap.to(particle, {
            x: x + (Math.random() - 0.5) * 100,
            y: y - 50 - Math.random() * 50,
            alpha: 0,
            duration: 1 + Math.random(),
            ease: "power2.out",
            onComplete: () => {
                this.particleContainer.removeChild(particle);
                const index = this.particles.indexOf(particle);
                if (index > -1) {
                    this.particles.splice(index, 1);
                }
            }
        });
    }
    
    setupEventListeners() {
        // キーボードイベント
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    setupCamera() {
        this.camera = {
            x: 0,
            y: 0,
            target: this.player.getSprite(),
            smoothing: 0.1
        };
    }
    
    updateCamera() {
        if (this.camera.target) {
            const targetX = -this.camera.target.x + this.app.screen.width / 2;
            const targetY = -this.camera.target.y + this.app.screen.height / 2;
            
            // スムーズなカメラ移動
            this.camera.x += (targetX - this.camera.x) * this.camera.smoothing;
            this.camera.y += (targetY - this.camera.y) * this.camera.smoothing;
            
            // 境界制限
            this.camera.x = Math.min(0, this.camera.x);
            this.camera.y = Math.min(-100, this.camera.y);
            
            this.gameContainer.x = this.camera.x;
            this.gameContainer.y = this.camera.y;
        }
    }
    
    handleInput() {
        // プレイヤーの移動
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.moveLeft();
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.moveRight();
        }
        if (this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.jump();
            this.keys['Space'] = false; // ジャンプの連続入力を防ぐ
        }
    }
    
    checkCollisions() {
        const playerPos = this.player.getPosition();
        const playerBounds = this.player.getBounds();
        
        // タイルとの衝突判定
        this.checkTileCollisions(playerPos, playerBounds);
        
        // オブジェクトとの衝突判定（コインなど）
        this.checkObjectCollisions(playerPos);
    }
    
    checkTileCollisions(playerPos, playerBounds) {
        // 簡易的な衝突判定
        const tileSize = 32;
        const mapWidth = this.tilemapLoader.getMapData()?.width || 20;
        const mapHeight = this.tilemapLoader.getMapData()?.height || 15;
        
        // プレイヤーの足元をチェック
        const feetY = playerPos.y + 24;
        const leftX = playerPos.x - 16;
        const rightX = playerPos.x + 16;
        
        // 地面との衝突
        const leftTile = this.tilemapLoader.getTileAt(leftX, feetY);
        const rightTile = this.tilemapLoader.getTileAt(rightX, feetY);
        
        if (leftTile > 0 || rightTile > 0) {
            const groundLevel = Math.floor(feetY / tileSize) * tileSize;
            this.player.sprite.y = groundLevel - 24;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
    }
    
    checkObjectCollisions(playerPos) {
        // オブジェクト（コインなど）との衝突判定
        const objectId = this.tilemapLoader.getObjectAt(playerPos.x, playerPos.y);
        
        if (objectId === 3) { // コイン
            // コインを取得
            this.collectCoin(playerPos.x, playerPos.y);
            this.tilemapLoader.removeObjectAt(playerPos.x, playerPos.y);
        }
    }
    
    collectCoin(x, y) {
        this.score += 100;
        this.updateScore();
        
        // エフェクトを作成
        for (let i = 0; i < 8; i++) {
            this.createParticle(x, y);
        }
        
        // サウンドエフェクト（視覚的フィードバック）
        gsap.to(this.player.getSprite().scale, {
            x: 1.2,
            y: 1.2,
            duration: 0.1,
            ease: "back.out(1.7)",
            yoyo: true,
            repeat: 1
        });
    }
    
    updateScore() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
            
            // スコア表示のアニメーション
            gsap.fromTo(scoreElement, 
                { scale: 1 },
                { 
                    scale: 1.3,
                    duration: 0.2,
                    ease: "back.out(1.7)",
                    yoyo: true,
                    repeat: 1
                }
            );
        }
    }
    
    handleResize() {
        // レスポンシブ対応
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        if (containerWidth && containerHeight) {
            this.app.renderer.resize(Math.min(800, containerWidth), Math.min(600, containerHeight));
        }
    }
    
    gameLoop(delta) {
        // 入力処理
        this.handleInput();
        
        // プレイヤー更新
        this.player.update();
        
        // 衝突判定
        this.checkCollisions();
        
        // カメラ更新
        this.updateCamera();
        
        // ゲーム境界のチェック
        const playerPos = this.player.getPosition();
        if (playerPos.y > 700) {
            // プレイヤーが落下した場合のリスポーン
            this.player.sprite.x = 100;
            this.player.sprite.y = 300;
            this.player.velocity = { x: 0, y: 0 };
        }
        
        // 画面外に出た場合の制限
        if (playerPos.x < 0) {
            this.player.sprite.x = 0;
            this.player.velocity.x = 0;
        }
    }
    
    // ゲームの状態を取得
    getGameState() {
        return {
            score: this.score,
            playerPosition: this.player.getPosition(),
            isRunning: true
        };
    }
    
    // ゲームをリセット
    reset() {
        this.score = 0;
        this.updateScore();
        this.player.sprite.x = 100;
        this.player.sprite.y = 300;
        this.player.velocity = { x: 0, y: 0 };
        
        // パーティクルをクリア
        this.particles.forEach(particle => {
            this.particleContainer.removeChild(particle);
        });
        this.particles = [];
        
        console.log('ゲームがリセットされました');
    }
}
