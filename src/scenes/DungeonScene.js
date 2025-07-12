import * as THREE from 'three';
import { gsap } from 'gsap';
import { BaseScene } from './SceneManager.js';

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
        this.raycaster = new THREE.Raycaster();
        this.isMoving = false;
        this.moveSpeed = 0.5;
        this.encounterRate = 0.1;
        this.dungeonName = transitionData.dungeonName || "未知のダンジョン";
    }
    
    async init() {
        // DungeonSceneはThree.jsを使用するため、PIXIコンテナは作成しない
        // 代わりにDOMエレメントを直接管理
        
        // Three.jsシーンを初期化
        this.initThreeJS();
        
        // 迷路を生成
        this.generateMaze();
        
        // ダンジョンの3Dモデルを作成
        this.createDungeon();
        
        // 敵とアイテムを配置
        this.placeEnemiesAndTreasures();
        
        // プレイヤーの初期位置を設定
        this.setupPlayer();
        
        // UI要素を作成
        this.createUI();
        
        // ライティングを設定
        this.setupLighting();
        
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
        
        // 再帰的な迷路生成
        this.carveMaze(1, 1);
        
        // 出入口を作成
        this.maze[1][0] = 0; // 入口
        this.maze[this.mazeHeight - 2][this.mazeWidth - 1] = 0; // 出口
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
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.8
        });
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666 
        });
        const ceilingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x222222 
        });
        
        // 迷路に基づいて3Dモデルを作成
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                const worldX = (x - this.mazeWidth / 2) * this.cellSize;
                const worldZ = (y - this.mazeHeight / 2) * this.cellSize;
                
                if (this.maze[y][x] === 0) {
                    // 通路：床を作成
                    const floorGeometry = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
                    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
                    floor.rotation.x = -Math.PI / 2;
                    floor.position.set(worldX, 0, worldZ);
                    floor.receiveShadow = true;
                    this.scene.add(floor);
                    
                    // 天井を作成
                    const ceilingGeometry = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
                    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
                    ceiling.rotation.x = Math.PI / 2;
                    ceiling.position.set(worldX, 3, worldZ);
                    this.scene.add(ceiling);
                } else {
                    // 壁を作成
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
        
        // 敵を配置
        const enemyCount = Math.floor(passagePositions.length * 0.1);
        for (let i = 0; i < enemyCount; i++) {
            const pos = passagePositions[Math.floor(Math.random() * passagePositions.length)];
            this.createEnemy(pos.x, pos.y);
        }
        
        // 宝箱を配置
        const treasureCount = Math.floor(passagePositions.length * 0.05);
        for (let i = 0; i < treasureCount; i++) {
            const pos = passagePositions[Math.floor(Math.random() * passagePositions.length)];
            this.createTreasure(pos.x, pos.y);
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
        
        // 敵の3Dモデル（簡易版）
        const enemyGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        enemy.position.set(worldX, 0.5, worldZ);
        enemy.castShadow = true;
        
        // 敵データを追加
        enemy.userData = {
            type: 'enemy',
            id: enemyId,
            name: 'ダンジョンモンスター',
            level: 1 + Math.floor(Math.random() * 3),
            hp: 20 + Math.floor(Math.random() * 15), // 20-35 HP
            attack: 8 + Math.floor(Math.random() * 5), // 8-12 攻撃力
            defense: 3 + Math.floor(Math.random() * 3), // 3-5 防御力
            exp: 15 + Math.floor(Math.random() * 10), // 15-25 経験値
            mazeX, mazeY
        };
        
        // 浮遊アニメーション
        gsap.to(enemy.position, {
            y: 0.8,
            duration: 2,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1
        });
        
        // 回転アニメーション
        gsap.to(enemy.rotation, {
            y: Math.PI * 2,
            duration: 4,
            ease: "none",
            repeat: -1
        });
        
        this.scene.add(enemy);
        this.enemies.push(enemy);
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
        const ambientLight = new THREE.AmbientLight(0x606060, 0.6);
        this.scene.add(ambientLight);
        
        // プレイヤーが持つランタン（強化）
        const lanternLight = new THREE.SpotLight(0xffdd44, 2.0, 15, Math.PI / 4, 0.3);
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
        const wallLight1 = new THREE.DirectionalLight(0x444488, 0.3);
        wallLight1.position.set(5, 5, 5);
        this.scene.add(wallLight1);
        
        const wallLight2 = new THREE.DirectionalLight(0x444488, 0.3);
        wallLight2.position.set(-5, 5, -5);
        this.scene.add(wallLight2);
        
        // 全体的な明度向上
        this.renderer.toneMappingExposure = 1.2;
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
        
        gsap.to(this.camera.rotation, {
            y: newRotation,
            duration: this.moveSpeed * 0.7,
            ease: "power2.out",
            onComplete: () => {
                this.isMoving = false;
            }
        });
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
            enemy: enemy.userData,
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
        
        console.log('ダンジョンシーンが破棄されました');
    }
}
