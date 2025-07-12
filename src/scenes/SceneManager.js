import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export class SceneManager {
    constructor(container) {
        this.scenes = new Map();
        this.currentScene = null;
        this.gameContainer = container;
        this.isTransitioning = false;
        this.app = null;
        
        this.gameData = {
            player: {
                name: 'プレイヤー',
                level: 1,
                hp: 50,
                maxHp: 50,
                mp: 20,
                maxMp: 20,
                exp: 0,
                position: { x: 400, y: 300 },
                dungeonPosition: { x: 0, y: 0, z: 0, rotation: 0 }
            },
            world: {
                currentArea: 'overworld',
                visitedAreas: ['overworld'],
                dungeonProgress: {}
            },
            inventory: {
                items: [],
                money: 100
            },
            flags: {
                firstTime: true,
                tutorialComplete: false
            }
        };
        
        // 保存されたデータがあれば読み込み
        this.loadGame();
    }
    
    async initPixiApp() {
        try {
            console.log('PixiJSアプリケーション初期化開始...');
            
            // PixiJS v8の新しいAPI使用
            this.app = new PIXI.Application();
            await this.app.init({
                width: 800,
                height: 600,
                backgroundColor: 0x000000,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });
            
            console.log('PixiJSアプリケーション初期化完了');
            
            // キャンバスをDOMに追加
            if (this.gameContainer) {
                this.gameContainer.appendChild(this.app.canvas);
                console.log('キャンバスをDOMに追加しました');
            } else {
                console.error('ゲームコンテナが見つかりません');
            }
            
            // 入力処理を初期化
            this.setupInputHandling();
            
            // 残ったオーバーレイを削除
            this.clearTransitionOverlay();
            
            console.log('PixiJSアプリケーションが初期化されました');
        } catch (error) {
            console.error('PixiJSアプリケーションの初期化に失敗しました:', error);
            throw error;
        }
    }
    
    setupInputHandling() {
        this.keys = {};
        
        // キーボードイベントリスナー
        window.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            if (this.currentScene && this.currentScene.handleInput) {
                this.currentScene.handleInput(this.keys);
            }
        });
        
        window.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // ゲームループを開始
        this.app.ticker.add((delta) => {
            if (this.currentScene && this.currentScene.update) {
                this.currentScene.update(delta);
            }
        });
    }
    
    registerScene(name, sceneClass) {
        this.scenes.set(name, sceneClass);
    }
    
    async switchScene(sceneName, transitionData = {}) {
        if (this.isTransitioning) return;
        
        // PixiJSアプリケーションが初期化されるまで待機
        if (!this.app) {
            await this.initPixiApp();
        }
        
        console.log(`シーン切り替え: ${this.currentScene?.name || 'なし'} → ${sceneName}`);
        
        this.isTransitioning = true;
        
        // フェードアウト効果
        await this.fadeOut();
        
        // 現在のシーンを破棄
        if (this.currentScene) {
            // DungeonSceneから他のシーンに切り替える場合、PIXIステージを復元
            if (this.currentScene.name === 'dungeon') {
                this.app.stage.alpha = 1;
            }
            
            this.currentScene.destroy();
            if (this.currentScene.container && this.app.stage.children.includes(this.currentScene.container)) {
                this.app.stage.removeChild(this.currentScene.container);
            }
        }
        
        // 新しいシーンを作成
        const SceneClass = this.scenes.get(sceneName);
        if (!SceneClass) {
            console.error(`シーン '${sceneName}' が見つかりません`);
            this.isTransitioning = false;
            return;
        }
        
        this.currentScene = new SceneClass(this, transitionData);
        this.currentScene.name = sceneName;
        
        // シーンを初期化
        await this.currentScene.init();
        
        // DungeonScene以外はPIXIコンテナをステージに追加
        if (this.currentScene.container && sceneName !== 'dungeon') {
            this.app.stage.addChild(this.currentScene.container);
        } else if (sceneName === 'dungeon') {
            // DungeonSceneはThree.jsを使用するため、PIXIステージは非表示
            this.app.stage.alpha = 0;
        } else if (this.currentScene.container) {
            // 通常のPIXIシーン
            this.app.stage.addChild(this.currentScene.container);
            this.app.stage.alpha = 1;
        }
        
        // フェードイン効果
        await this.fadeIn();
        
        // 念のため、オーバーレイが残っている場合は強制削除
        this.clearTransitionOverlay();
        
        this.isTransitioning = false;
    }
    
    async fadeOut() {
        return new Promise((resolve) => {
            // オーバーレイを作成
            const overlay = document.createElement('div');
            overlay.id = 'scene-transition';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: black;
                z-index: 10000;
                opacity: 0;
                pointer-events: none;
            `;
            document.body.appendChild(overlay);
            
            gsap.to(overlay, {
                opacity: 1,
                duration: 0.5,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    }
    
    async fadeIn() {
        return new Promise((resolve) => {
            const overlay = document.getElementById('scene-transition');
            if (overlay) {
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.5,
                    ease: "power2.inOut",
                    onComplete: () => {
                        overlay.remove();
                        resolve();
                    }
                });
            } else {
                // オーバーレイが見つからない場合はすぐに解決
                resolve();
            }
        });
    }
    
    clearTransitionOverlay() {
        const overlay = document.getElementById('scene-transition');
        if (overlay) {
            overlay.remove();
            console.log('シーン遷移オーバーレイを強制削除しました');
        }
    }
    
    update(delta) {
        if (this.currentScene && !this.isTransitioning) {
            this.currentScene.update(delta);
        }
    }
    
    handleInput(input) {
        if (this.currentScene && !this.isTransitioning) {
            this.currentScene.handleInput(input);
        }
    }
    
    getGameData() {
        return this.gameData;
    }
    
    updateGameData(updates) {
        Object.assign(this.gameData, updates);
    }
    
    saveGame() {
        localStorage.setItem('megatenRPG_save', JSON.stringify(this.gameData));
        console.log('ゲームデータを保存しました');
    }
    
    loadGame() {
        const saveData = localStorage.getItem('megatenRPG_save');
        if (saveData) {
            try {
                const loadedData = JSON.parse(saveData);
                // デフォルトデータとマージして不足部分を補完
                this.gameData = Object.assign(this.gameData, loadedData);
                console.log('ゲームデータを読み込みました');
                return true;
            } catch (error) {
                console.error('セーブデータの読み込みに失敗しました:', error);
                return false;
            }
        }
        return false;
    }
    
    // デバッグ用：敵データをリセット
    resetEnemyData() {
        if (this.gameData.defeatedEnemies) {
            delete this.gameData.defeatedEnemies;
        }
        this.saveGame();
        console.log('敵データをリセットしました');
    }

    // デバッグ用：ゲームデータを完全リセット
    resetGameData() {
        localStorage.removeItem('js-kadai-save');
        this.gameData = {
            player: {
                name: 'プレイヤー',
                level: 1,
                hp: 50,
                maxHp: 50,
                mp: 20,
                maxMp: 20,
                exp: 0,
                position: { x: 400, y: 300 },
                dungeonPosition: { x: 0, y: 0, z: 0, rotation: 0 }
            },
            world: {
                currentArea: 'overworld',
                visitedAreas: ['overworld'],
                dungeonProgress: {}
            },
            inventory: {
                items: [],
                money: 100
            },
            flags: {
                firstTime: true,
                tutorialComplete: false
            }
        };
        console.log('ゲームデータを完全リセットしました');
    }
}

// 基本シーンクラス
export class BaseScene {
    constructor(sceneManager, transitionData = {}) {
        this.sceneManager = sceneManager;
        this.transitionData = transitionData;
        this.container = null;
        this.keys = {};
        this.name = '';
    }
    
    async init() {
        // 継承先で実装
        throw new Error('init() method must be implemented by subclass');
    }
    
    update(delta) {
        // 継承先で実装
    }
    
    handleInput(input) {
        // 継承先で実装
    }
    
    destroy() {
        // リソースの解放など
        if (this.container && this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
    }
    
    // シーン切り替えのヘルパーメソッド
    switchTo(sceneName, data = {}) {
        this.sceneManager.switchScene(sceneName, data);
    }
    
    // ゲームデータアクセス
    getGameData() {
        return this.sceneManager.getGameData();
    }
    
    updateGameData(updates) {
        this.sceneManager.updateGameData(updates);
    }
}
