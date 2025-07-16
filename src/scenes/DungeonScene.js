import * as THREE from 'three';
import { gsap } from 'gsap';
import { BaseScene } from './SceneManager.js';
import { ImageLoader } from '../assets/ImageLoader.js';
import { ScrollDiscovery } from '../ui/ScrollDiscovery.js';
import { PlayerInventory } from '../data/PlayerInventory.js';

export class DungeonScene extends BaseScene {
    constructor(sceneManager, transitionData = {}) {
        super(sceneManager, transitionData);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = {
            x: 0,
            z: 0,
            rotation: 0,
            height: 1.6
        };
        this.maze = [];
        this.mazeWidth = 21;
        this.mazeHeight = 21;
        this.cellSize = 2;
        this.enemies = [];
        this.treasures = [];
        this.scrolls = []; // スクロール配置
        this.raycaster = new THREE.Raycaster();
        this.isMoving = false;
        this.moveSpeed = 0.5;
        this.encounterRate = 0.1;
        this.dungeonName = transitionData.dungeonName || "未知のダンジョン";
        this.imageLoader = null;
        this.playerInventory = null;
        this.scrollDiscovery = null;
    }
    
    async init() {
        // DungeonSceneはThree.jsを使用するため、PIXIコンテナは作成しない
        // 代わりにDOMエレメントを直接管理
        
        // ImageLoaderを初期化
        this.imageLoader = new ImageLoader();
        await this.imageLoader.loadAllAssets();
        // 壁・床テクスチャをThree.js用に追加読み込み
        await this.imageLoader.loadThreeTexture('wall', '/src/images/Dungeon/texture_paper01.png');
        await this.imageLoader.loadThreeTexture('floor', '/src/images/Dungeon/texture_concrete04.png');
        
        // Three.jsシーンを初期化
        this.initThreeJS();
        
        // 迷路を生成
        this.generateMaze();
        
        // ダンジョンの3Dモデルを作成
        this.createDungeon();
        
        // 敵とアイテムを配置
        this.placeEnemiesAndTreasures();
        
        // スクロールを配置
        this.placeScrolls();
        
        // プレイヤーインベントリとスクロール発見システムを初期化
        this.playerInventory = new PlayerInventory();
        this.scrollDiscovery = new ScrollDiscovery(this.sceneManager, this.playerInventory);
        this.scrollDiscovery.init();
        
        // 戦闘から戻ってきた場合の処理
        if (this.transitionData && (this.transitionData.victory || this.transitionData.escaped)) {
            this.onReturnFromBattle(this.transitionData);
        }
        
        console.log(`3Dダンジョン "${this.dungeonName}" が初期化されました`);
    }
    
    initThreeJS() {
        // Three.jsのシーン作成
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x222222, 2, 20); // より明るく、より遠くまで見える
        
        // カメラ作成（主観視点）
        this.camera = new THREE.PerspectiveCamera(
            75,
            800 / 600,
            0.1,
            1000
        );
        
        // レンダラー作成
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(800, 600);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x333333, 1.0); // より明るい背景色
        this.renderer.gammaOutput = true;
        this.renderer.gammaFactor = 2.2;
        
        // HTMLキャンバスをゲームコンテナに追加
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.renderer.domElement);
        } else {
            console.error('ゲームコンテナが見つかりません');
        }
    }
    
    generateMaze() {
        // 簡単な迷路生成アルゴリズム
        this.maze = [];
        // 初期化（全て壁）
        for (let y = 0; y < this.mazeHeight; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.mazeWidth; x++) {
                this.maze[y][x] = 1; // 1 = 壁, 0 = 通路
            }
        }
        // 部屋を追加
        this.addRoomsToMaze();
        // 再帰的な迷路生成
        this.carveMaze(1, 1);
        // 出入口を作成
        this.maze[1][0] = 0; // 入口
        this.maze[this.mazeHeight - 2][this.mazeWidth - 1] = 0; // 出口
    }

    // 部屋をランダムに複数配置
    addRoomsToMaze() {
        const roomCount = 4 + Math.floor(Math.random() * 3); // 4～6部屋
        const minSize = 3, maxSize = 5;
        const rooms = [];
        for (let i = 0; i < roomCount; i++) {
            const w = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
            const h = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
            const x = 1 + Math.floor(Math.random() * (this.mazeWidth - w - 2));
            const y = 1 + Math.floor(Math.random() * (this.mazeHeight - h - 2));
            // 重なりチェック
            let overlaps = false;
            for (const r of rooms) {
                if (x + w < r.x - 1 || x > r.x + r.w + 1 || y + h < r.y - 1 || y > r.y + r.h + 1) continue;
                overlaps = true;
                break;
            }
            if (overlaps) continue;
            // 部屋をmazeに反映
            for (let dy = 0; dy < h; dy++) {
                for (let dx = 0; dx < w; dx++) {
                    this.maze[y + dy][x + dx] = 0;
                }
            }
            rooms.push({ x, y, w, h });
        }
    }
    
    carveMaze(x, y) {
        const directions = [
            [0, -2], [2, 0], [0, 2], [-2, 0]
        ];
        
        // ランダムに方向をシャッフル
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        this.maze[y][x] = 0; // 現在位置を通路に
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx > 0 && nx < this.mazeWidth - 1 && 
                ny > 0 && ny < this.mazeHeight - 1 && 
                this.maze[ny][nx] === 1) {
                
                this.maze[y + dy / 2][x + dx / 2] = 0; // 間の壁を削除
                this.carveMaze(nx, ny);
            }
        }
    }
    
    createDungeon() {
        // 床と壁のマテリアル
        const floorTexture = this.imageLoader.getThreeTexture('floor');
        const wallTexture = this.imageLoader.getThreeTexture('wall');
        if (floorTexture) {
            floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
            floorTexture.repeat.set(this.mazeWidth, this.mazeHeight);
        } else {
            console.warn('床テクスチャがロードできませんでした。パスや画像を確認してください。');
        }
        if (wallTexture) {
            wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
            wallTexture.repeat.set(2, 2);
        } else {
            console.warn('壁テクスチャがロードできませんでした。パスや画像を確認してください。');
        }
        const floorMaterial = floorTexture ?
            new THREE.MeshLambertMaterial({ map: floorTexture, color: 0xffffff }) :
            new THREE.MeshLambertMaterial({ color: 0x2196f3 }); // フォールバック: 青
        const wallMaterial = wallTexture ?
            new THREE.MeshLambertMaterial({ map: wallTexture, color: 0xffffff }) :
            new THREE.MeshLambertMaterial({ color: 0xe53935 }); // フォールバック: 赤
        const ceilingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x222222 
        });

        // --- 床と天井を一括で配置 ---
        const floorGeometry = new THREE.PlaneGeometry(this.mazeWidth * this.cellSize, this.mazeHeight * this.cellSize);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);

        const ceilingGeometry = new THREE.PlaneGeometry(this.mazeWidth * this.cellSize, this.mazeHeight * this.cellSize);
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 3, 0);
        this.scene.add(ceiling);
        // --- ここまで一括配置 ---

        // 壁のみ個別配置
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 1) {
                    const worldX = (x - this.mazeWidth / 2) * this.cellSize;
                    const worldZ = (y - this.mazeHeight / 2) * this.cellSize;
                    const wallGeometry = new THREE.BoxGeometry(this.cellSize, 3, this.cellSize);
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(worldX, 1.5, worldZ);
                    wall.castShadow = true;
                    this.scene.add(wall);
                }
            }
        }
    }
    
    placeEnemiesAndTreasures() {
        // 通路にランダムに敵とアイテムを配置
        const passagePositions = [];
        
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 0) {
                    passagePositions.push({ x, y });
                }
            }
        }
        
        // 敵を配置（出現率を大幅に減少）
        const enemyCount = Math.floor(passagePositions.length * 0.03); // 10%から3%に減少
        const usedPositions = new Set();
        
        for (let i = 0; i < enemyCount; i++) {
            let attempts = 0;
            let pos;
            
            // 重複しない位置を探す
            do {
                pos = passagePositions[Math.floor(Math.random() * passagePositions.length)];
                attempts++;
            } while (usedPositions.has(`${pos.x},${pos.y}`) && attempts < 50);
            
            if (attempts < 50) {
                usedPositions.add(`${pos.x},${pos.y}`);
                this.createEnemy(pos.x, pos.y);
            }
        }
        
        // 宝箱を配置
        const treasureCount = Math.floor(passagePositions.length * 0.05);
        for (let i = 0; i < treasureCount; i++) {
            const pos = passagePositions[Math.floor(Math.random() * passagePositions.length)];
            this.createTreasure(pos.x, pos.y);
        }
        
        // スクロールを配置
        const scrollCount = Math.floor(passagePositions.length * 0.02); // 5%の確率で配置
        for (let i = 0; i < scrollCount; i++) {
            const pos = passagePositions[Math.floor(Math.random() * passagePositions.length)];
            this.createScroll(pos.x, pos.y);
        }
    }
    
    createEnemy(mazeX, mazeY) {
        const worldX = (mazeX - this.mazeWidth / 2) * this.cellSize;
        const worldZ = (mazeY - this.mazeHeight / 2) * this.cellSize;
        
        // 敵の固有IDを生成
        const enemyId = `${this.dungeonName}_${mazeX}_${mazeY}`;
        
        // 既に倒された敵はスキップ
        const gameData = this.getGameData();
        if (gameData.defeatedEnemies && gameData.defeatedEnemies.includes(enemyId)) {
            return;
        }
        
        // 敵の種類を重み付きランダムで選択（トロールの出現率を下げる）
        const enemyTypes = [
            { type: 'troll', name: 'トロール', color: 0xff4444, baseLevel: 1, weight: 1 }, // 重み1（低い）
            { type: 'skeleton', name: 'スケルトン', color: 0xcccccc, baseLevel: 2, weight: 3 }, // 重み3
            { type: 'dragon_red', name: 'レッドドラゴン', color: 0xff0000, baseLevel: 4, weight: 2 }, // 重み2
            { type: 'dragon_blue', name: 'ブルードラゴン', color: 0x0066ff, baseLevel: 3, weight: 2 }, // 重み2
            { type: 'dark_angel', name: 'ダークエンジェル', color: 0x663399, baseLevel: 5, weight: 2 }, // 重み2
            { type: 'dark_mage', name: 'ダークメイジ', color: 0x330066, baseLevel: 3, weight: 3 } // 重み3
        ];
        
        // 重み付きランダム選択
        const totalWeight = enemyTypes.reduce((sum, enemy) => sum + enemy.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        let selectedEnemy = enemyTypes[0]; // デフォルト
        
        for (const enemy of enemyTypes) {
            randomWeight -= enemy.weight;
            if (randomWeight <= 0) {
                selectedEnemy = enemy;
                break;
            }
        }
        
        const enemyTemplate = selectedEnemy;
        
        // 敵の3Dモデル（画像テクスチャベース）
        const enemyGeometry = new THREE.PlaneGeometry(0.4, 0.6); // サイズを小さく（0.8x1.2から0.4x0.6に）
        
        // 画像テクスチャを使用
        let enemyMaterial;
        if (this.imageLoader && this.imageLoader.isLoaded) {
            const texture = this.getEnemyTexture(enemyTemplate.type);
            if (texture) {
                // PixiJSテクスチャをThree.jsで使用するために変換
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = texture.width;
                canvas.height = texture.height;
                
                // テクスチャを描画
                const img = texture.source.resource;
                ctx.drawImage(img, 0, 0);
                
                const threeTexture = new THREE.CanvasTexture(canvas);
                enemyMaterial = new THREE.MeshLambertMaterial({ 
                    map: threeTexture,
                    transparent: true
                });
            } else {
                enemyMaterial = new THREE.MeshLambertMaterial({ color: enemyTemplate.color });
            }
        } else {
            enemyMaterial = new THREE.MeshLambertMaterial({ color: enemyTemplate.color });
        }
        
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        enemy.position.set(worldX, 1.0, worldZ); // 少し高い位置に配置
        enemy.lookAt(0, 1.0, 0); // プレイヤーの方向を向く
        
        // 敵データを追加
        enemy.userData = {
            type: 'enemy',
            id: enemyId,
            enemyType: enemyTemplate.type,
            name: enemyTemplate.name,
            level: enemyTemplate.baseLevel + Math.floor(Math.random() * 3),
            hp: 20 + enemyTemplate.baseLevel * 10 + Math.floor(Math.random() * 15),
            attack: 8 + enemyTemplate.baseLevel * 3 + Math.floor(Math.random() * 5),
            defense: 3 + enemyTemplate.baseLevel * 2 + Math.floor(Math.random() * 3),
            exp: 15 + enemyTemplate.baseLevel * 5 + Math.floor(Math.random() * 10),
            mazeX, mazeY
        };
        
        // 浮遊アニメーション（より動的に）
        gsap.to(enemy.position, {
            y: 1.3,
            duration: 1.5 + Math.random(),
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1
        });
        
        // 回転アニメーション（敵の種類により異なる）
        const rotationSpeed = 2 + Math.random() * 2;
        gsap.to(enemy.rotation, {
            y: Math.PI * 2,
            duration: rotationSpeed,
            ease: "none",
            repeat: -1
        });
        
        this.scene.add(enemy);
        this.enemies.push(enemy);
        
        console.log(`敵 ${enemyTemplate.name} (Lv.${enemy.userData.level}) を生成しました`);
    }

    getEnemyTexture(enemyType) {
        if (!this.imageLoader || !this.imageLoader.isLoaded) {
            return null;
        }
        
        switch (enemyType) {
            case 'troll':
                return this.imageLoader.getTexture('troll');
            case 'skeleton':
                return this.imageLoader.getTexture('enemy_skeleton');
            case 'dragon_red':
                return this.imageLoader.getTexture('enemy_dragon_red');
            case 'dragon_blue':
                return this.imageLoader.getTexture('enemy_dragon_blue');
            case 'dark_angel':
                return this.imageLoader.getTexture('enemy_dark_angel');
            case 'dark_mage':
                return this.imageLoader.getTexture('enemy_dark_mage');
            default:
                return this.imageLoader.getTexture('troll');
        }
    }
    
    createTreasure(mazeX, mazeY) {
        const worldX = (mazeX - this.mazeWidth / 2) * this.cellSize;
        const worldZ = (mazeY - this.mazeHeight / 2) * this.cellSize;
        
        // 宝箱の3Dモデル（簡易版）
        const treasureGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
        const treasureMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        const treasure = new THREE.Mesh(treasureGeometry, treasureMaterial);
        treasure.position.set(worldX, 0.15, worldZ);
        treasure.castShadow = true;
        
        treasure.userData = {
            type: 'treasure',
            mazeX, mazeY,
            collected: false
        };
        
        // 光るエフェクト
        gsap.to(treasureMaterial, {
            emissive: new THREE.Color(0x333300),
            duration: 1.5,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1
        });
        
        this.scene.add(treasure);
        this.treasures.push(treasure);
        
        return treasure;
    }
    
    placeScrolls() {
        // ダンジョン内にスクロールを配置
        const scrollCount = 1; // ダンジョンごとに1つのスクロール
        
        for (let i = 0; i < scrollCount; i++) {
            // ランダムな場所を選択（空いている場所）
            let attempts = 0;
            let mazeX, mazeY;
            
            do {
                mazeX = Math.floor(Math.random() * this.mazeWidth);
                mazeY = Math.floor(Math.random() * this.mazeHeight);
                attempts++;
            } while (this.maze[mazeY][mazeX] === 1 && attempts < 100); // 壁ではない場所
            
            if (attempts >= 100) continue; // 配置できない場合はスキップ
            
            this.createScroll(mazeX, mazeY);
        }
    }
    
    createScroll(mazeX, mazeY) {
        // スクロールの3Dモデルを作成
        const scrollGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
        const scrollMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffd700,
            shininess: 100
        });
        
        const scrollMesh = new THREE.Mesh(scrollGeometry, scrollMaterial);
        
        // ワールド座標に変換
        const worldX = (mazeX - this.mazeWidth / 2) * this.cellSize;
        const worldZ = (mazeY - this.mazeHeight / 2) * this.cellSize;
        
        scrollMesh.position.set(worldX, 0.3, worldZ);
        scrollMesh.rotation.z = Math.PI / 2; // 横向きに配置
        
        // ゆっくりと回転させる
        gsap.to(scrollMesh.rotation, {
            y: Math.PI * 2,
            duration: 6,
            repeat: -1,
            ease: "none"
        });
        
        // 上下に浮遊させる
        gsap.to(scrollMesh.position, {
            y: 0.6,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut"
        });
        
        this.scene.add(scrollMesh);
        
        // スクロールデータを保存
        const scrollLocation = ScrollDiscovery.getRandomScrollLocation();
        const scroll = {
            id: `scroll_${mazeX}_${mazeY}`,
            mesh: scrollMesh,
            position: { x: worldX, z: worldZ },
            mazePosition: { x: mazeX, y: mazeY },
            location: scrollLocation,
            collected: false
        };
        
        this.scrolls.push(scroll);
        
        return scroll;
    }
    
    setupPlayer() {
        const gameData = this.getGameData();
        
        // プレイヤーの初期位置（迷路座標系）
        this.player.x = 1;
        this.player.z = 1;
        this.player.rotation = 0;
        
        // ゲームデータから位置を復元（もしあれば）
        if (gameData.player.dungeonPosition) {
            Object.assign(this.player, gameData.player.dungeonPosition);
        }
        
        this.updateCameraPosition();
    }
    
    updateCameraPosition() {
        const worldX = (this.player.x - this.mazeWidth / 2) * this.cellSize;
        const worldZ = (this.player.z - this.mazeHeight / 2) * this.cellSize;
        
        this.camera.position.set(worldX, this.player.height, worldZ);
        this.camera.rotation.y = this.player.rotation;
    }
    
    setupLighting() {
        // 環境光（明るめに調整）
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // 明るい白色、強度UP
        this.scene.add(ambientLight);
        // プレイヤーが持つランタン（強化）
        const lanternLight = new THREE.SpotLight(0xfff8c0, 2.5, 20, Math.PI / 3, 0.2);
        lanternLight.position.set(0, 2, 0);
        lanternLight.target.position.set(0, 0, -5);
        lanternLight.castShadow = true;
        lanternLight.shadow.mapSize.width = 2048;
        lanternLight.shadow.mapSize.height = 2048;
        lanternLight.shadow.camera.near = 0.1;
        lanternLight.shadow.camera.far = 20;
        this.camera.add(lanternLight);
        this.camera.add(lanternLight.target);
        this.scene.add(this.camera);
        // 追加の周辺照明（壁面照明）
        const wallLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
        wallLight1.position.set(5, 5, 5);
        this.scene.add(wallLight1);
        const wallLight2 = new THREE.DirectionalLight(0xffffff, 0.7);
        wallLight2.position.set(-5, 5, -5);
        this.scene.add(wallLight2);
        // 全体的な明度向上
        this.renderer.toneMappingExposure = 1.5;
    }
    
    createUI() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'dungeon-ui';
        uiContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        `;
        
        const gameData = this.getGameData();
        uiContainer.innerHTML = `
            <div><strong>${this.dungeonName}</strong></div>
            <div>レベル: ${gameData.player.level}</div>
            <div>HP: ${gameData.player.hp}/${gameData.player.maxHp}</div>
            <div>MP: ${gameData.player.mp}/${gameData.player.maxMp}</div>
            <div style="margin-top: 10px; font-size: 12px;">
                移動: 矢印キー<br>
                振り向く: A/D<br>
                戻る: Escキー
            </div>
        `;
        
        document.body.appendChild(uiContainer);
    }
    
    update(delta) {
        this.handleMovement();
        this.checkCollisions();
        this.checkForExit();
        
        // Three.jsシーンをレンダリング
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    handleInput(input) {
        this.keys = input;
    }
    
    handleMovement() {
        if (this.isMoving) return;
        
        let newX = this.player.x;
        let newZ = this.player.z;
        let newRotation = this.player.rotation;
        
        // 前進・後退
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            const dx = Math.round(Math.sin(this.player.rotation));
            const dz = Math.round(-Math.cos(this.player.rotation));
            newX += dx;
            newZ += dz;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            const dx = Math.round(-Math.sin(this.player.rotation));
            const dz = Math.round(Math.cos(this.player.rotation));
            newX += dx;
            newZ += dz;
        }
        
        // 回転
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            newRotation += Math.PI / 2;
            this.rotate(newRotation);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            newRotation -= Math.PI / 2;
            this.rotate(newRotation);
        }
        
        // 移動可能かチェック
        if ((newX !== this.player.x || newZ !== this.player.z) && this.canMoveTo(newX, newZ)) {
            this.moveTo(newX, newZ);
        }
        
        // ダンジョンから出る
        if (this.keys['Escape']) {
            this.exitDungeon();
        }
    }
    
    canMoveTo(x, z) {
        // 境界チェック
        if (x < 0 || x >= this.mazeWidth || z < 0 || z >= this.mazeHeight) {
            return false;
        }
        
        // 壁チェック
        return this.maze[z][x] === 0;
    }
    
    moveTo(x, z) {
        this.isMoving = true;
        
        const oldX = this.player.x;
        const oldZ = this.player.z;
        
        this.player.x = x;
        this.player.z = z;
        
        // スムーズな移動アニメーション
        const worldX = (x - this.mazeWidth / 2) * this.cellSize;
        const worldZ = (z - this.mazeHeight / 2) * this.cellSize;
        
        gsap.to(this.camera.position, {
            x: worldX,
            z: worldZ,
            duration: this.moveSpeed,
            ease: "power2.out",
            onComplete: () => {
                this.isMoving = false;
                this.checkRandomEncounter();
            }
        });
        
        // プレイヤー位置を保存
        this.updateGameData({
            player: {
                ...this.getGameData().player,
                dungeonPosition: { ...this.player }
            }
        });
    }
    
    rotate(newRotation) {
        this.isMoving = true;
        this.player.rotation = newRotation;
        if (this.camera && this.camera.rotation) {
            gsap.to(this.camera.rotation, {
                y: newRotation,
                duration: this.moveSpeed * 0.7,
                ease: "power2.out",
                onComplete: () => {
                    this.isMoving = false;
                }
            });
        } else {
            this.isMoving = false;
        }
    }
    
    checkCollisions() {
        // 敵との衝突判定
        this.enemies.forEach(enemy => {
            if (enemy.userData.mazeX === this.player.x && 
                enemy.userData.mazeY === this.player.z) {
                this.encounterEnemy(enemy);
            }
        });
        
        // 宝箱との衝突判定
        this.treasures.forEach(treasure => {
            if (!treasure.userData.collected &&
                treasure.userData.mazeX === this.player.x && 
                treasure.userData.mazeY === this.player.z) {
                this.collectTreasure(treasure);
            }
        });
        
        // スクロールとの衝突判定
        this.scrolls.forEach(scroll => {
            if (!scroll.collected &&
                scroll.mazePosition.x === this.player.x && 
                scroll.mazePosition.y === this.player.z) {
                this.collectScroll(scroll);
            }
        });
    }
    
    checkForExit() {
        // 出口に到達したかチェック
        if (this.player.x === this.mazeWidth - 1 && 
            this.player.z === this.mazeHeight - 2) {
            this.exitDungeon();
        }
    }
    
    checkRandomEncounter() {
        if (Math.random() < this.encounterRate) {
            this.triggerRandomEncounter();
        }
    }
    
    encounterEnemy(enemy) {
        console.log(`敵 "${enemy.userData.name}" と遭遇！`);
        
        // 戦闘シーンに切り替え
        this.switchTo('battle', {
            enemy: {
                name: enemy.userData.name,
                level: enemy.userData.level,
                hp: enemy.userData.hp,
                attack: enemy.userData.attack,
                defense: enemy.userData.defense,
                exp: enemy.userData.exp,
                enemyType: enemy.userData.enemyType // 敵の種類情報を追加
            },
            enemyId: enemy.userData.id, // 敵の固有IDを追加
            battleBackground: 'dungeon',
            returnScene: 'dungeon',
            returnData: { 
                dungeonName: this.dungeonName,
                defeatedEnemies: this.getGameData().defeatedEnemies || []
            }
        });
    }
    
    collectTreasure(treasure) {
        console.log('宝箱を発見！');
        
        treasure.userData.collected = true;
        
        // 宝箱を消す
        gsap.to(treasure.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.5,
            ease: "back.in(1.7)",
            onComplete: () => {
                this.scene.remove(treasure);
            }
        });
        
        // アイテム獲得処理（後で実装）
        // this.getGameData().inventory.push(newItem);
    }
    
    discoverScroll(scroll) {
        console.log('スクロールを発見！');
        
        scroll.userData.discovered = true;
        
        // スクロールを消す
        gsap.to(scroll.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.5,
            ease: "back.in(1.7)",
            onComplete: () => {
                this.scene.remove(scroll);
            }
        });
        
        // プレイヤーのインベントリに追加
        const gameData = this.getGameData();
        if (!gameData.player.inventory) {
            gameData.player.inventory = new PlayerInventory();
        }
        gameData.player.inventory.addItem('scroll', 1);
        this.updateGameData(gameData);
    }
    
    triggerRandomEncounter() {
        console.log('ダンジョンでランダムエンカウント！');
        
        const enemies = ['スケルトン', 'ゴブリン', 'スライム', '悪霊'];
        const enemyName = enemies[Math.floor(Math.random() * enemies.length)];
        
        this.switchTo('battle', {
            enemy: {
                name: enemyName,
                level: 1 + Math.floor(Math.random() * 3)
            },
            battleBackground: 'dungeon',
            returnScene: 'dungeon',
            returnData: { dungeonName: this.dungeonName }
        });
    }
    
    exitDungeon() {
        console.log('ダンジョンから出ます');
        
        // ワールドマップに戻る
        this.switchTo('worldmap');
    }
    
    // 戦闘から戻ってきたときの処理
    onReturnFromBattle(battleResult) {
        if (battleResult && battleResult.victory && battleResult.enemyId) {
            // 倒された敵をシーンから削除
            this.removeEnemyById(battleResult.enemyId);
            
            // 倒された敵をゲームデータに記録
            const gameData = this.getGameData();
            if (!gameData.defeatedEnemies) {
                gameData.defeatedEnemies = [];
            }
            if (!gameData.defeatedEnemies.includes(battleResult.enemyId)) {
                gameData.defeatedEnemies.push(battleResult.enemyId);
            }
            this.updateGameData(gameData);
            
            console.log(`敵 ${battleResult.enemyId} を撃破しました。経験値: ${battleResult.experienceGained}`);
            if (battleResult.leveledUp) {
                console.log('レベルアップしました！');
            }
        } else if (battleResult && battleResult.escaped) {
            console.log('戦闘から逃走しました。敵は残っています。');
        }
    }
    
    // 指定したIDの敵を削除
    removeEnemyById(enemyId) {
        const enemyIndex = this.enemies.findIndex(enemy => enemy.userData.id === enemyId);
        if (enemyIndex !== -1) {
            const enemy = this.enemies[enemyIndex];
            
            // 消滅エフェクト
            gsap.to(enemy.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.5,
                ease: "back.in(1.7)",
                onComplete: () => {
                    this.scene.remove(enemy);
                }
            });
            
            // 配列から削除
            this.enemies.splice(enemyIndex, 1);
            
            console.log(`敵 ${enemyId} がダンジョンから削除されました`);
        }
    }
    
    destroy() {
        super.destroy();
        
        // Three.jsリソースを解放
        if (this.renderer) {
            const gameContainer = document.getElementById('gameContainer');
            if (gameContainer && this.renderer.domElement.parentNode === gameContainer) {
                gameContainer.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
        }
        
        // UIを削除
        const ui = document.getElementById('dungeon-ui');
        if (ui) {
            ui.remove();
        }
        
        // オブジェクトを解放
        this.enemies = [];
        this.treasures = [];
        this.scrolls = [];
        
        console.log('ダンジョンシーンが破棄されました');
    }
    
    async collectScroll(scroll) {
        if (scroll.collected) return;
        
        scroll.collected = true;
        
        // スクロール消失エフェクト
        gsap.to(scroll.mesh.scale, {
            x: 0, y: 0, z: 0,
            duration: 0.5,
            ease: "power2.in"
        });
        
        gsap.to(scroll.mesh.rotation, {
            y: scroll.mesh.rotation.y + Math.PI * 4,
            duration: 0.5,
            ease: "power2.in"
        });
        
        // パーティクルエフェクト
        this.createScrollCollectionEffect(scroll.position);
        
        // 0.5秒後にスクロールを削除
        setTimeout(() => {
            this.scene.remove(scroll.mesh);
        }, 500);
        
        console.log(`スクロールを発見: ${scroll.location}`);
        
        // スクロール発見演出を表示
        if (this.scrollDiscovery) {
            await this.scrollDiscovery.discoverScroll(scroll.location);
        }
    }
    
    createScrollCollectionEffect(position) {
        // 金色のパーティクル効果
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffd700,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                position.x + (Math.random() - 0.5) * 2,
                0.5 + Math.random() * 2,
                position.z + (Math.random() - 0.5) * 2
            );
            
            this.scene.add(particle);
            particles.push(particle);
            
            // パーティクルを上に飛ばして消す
            gsap.to(particle.position, {
                y: particle.position.y + 3,
                duration: 1.5,
                ease: "power2.out"
            });
            
            gsap.to(particle.material, {
                opacity: 0,
                duration: 1.5,
                ease: "power2.out",
                onComplete: () => {
                    this.scene.remove(particle);
                }
            });
        }
    }
}
