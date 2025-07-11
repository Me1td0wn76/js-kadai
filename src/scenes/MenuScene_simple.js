import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { BaseScene } from './SceneManager.js';

export class MenuScene extends BaseScene {
    constructor(sceneManager, transitionData = {}) {
        super(sceneManager, transitionData);
        this.selectedOption = 0;
        this.menuOptions = ['新しいゲーム', '続きから', 'オプション', '終了'];
        this.menuTexts = [];
        this.titleText = null;
        this.cursor = null;
    }
    
    async init() {
        console.log('MenuScene初期化開始');
        
        this.container = new PIXI.Container();
        
        // シンプルな背景
        this.createSimpleBackground();
        
        // タイトル
        this.createTitle();
        
        // メニュー
        this.createSimpleMenu();
        
        console.log('MenuScene初期化完了');
    }
    
    createSimpleBackground() {
        const background = new PIXI.Graphics();
        background.fill(0x000033);
        background.rect(0, 0, 800, 600);
        this.container.addChild(background);
        
        console.log('背景作成完了');
    }
    
    createTitle() {
        this.titleText = new PIXI.Text('女神転生風RPG', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xffffff,
            align: 'center'
        });
        
        this.titleText.anchor.set(0.5);
        this.titleText.x = 400;
        this.titleText.y = 150;
        
        this.container.addChild(this.titleText);
        
        console.log('タイトル作成完了');
    }
    
    createSimpleMenu() {
        // メニュー背景
        const menuBg = new PIXI.Graphics();
        menuBg.fill({ color: 0x000000, alpha: 0.7 });
        menuBg.rect(300, 250, 200, 200);
        this.container.addChild(menuBg);
        
        // メニュー項目
        this.menuOptions.forEach((option, index) => {
            const text = new PIXI.Text(option, {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff
            });
            
            text.anchor.set(0.5);
            text.x = 400;
            text.y = 280 + index * 35;
            
            this.container.addChild(text);
            this.menuTexts.push(text);
        });
        
        // カーソル
        this.cursor = new PIXI.Graphics();
        this.cursor.fill(0xffff00);
        this.cursor.poly([0, 0, 15, 8, 0, 16]);
        this.cursor.x = 320;
        this.updateCursor();
        
        this.container.addChild(this.cursor);
        
        console.log('メニュー作成完了');
    }
    
    updateCursor() {
        if (this.cursor) {
            this.cursor.y = 275 + this.selectedOption * 35;
            
            // 選択項目をハイライト
            this.menuTexts.forEach((text, index) => {
                text.tint = index === this.selectedOption ? 0xffff00 : 0xffffff;
            });
        }
    }
    
    handleMenuSelection() {
        const selectedOption = this.menuOptions[this.selectedOption];
        
        console.log(`選択されたオプション: ${selectedOption}`);
        
        switch (selectedOption) {
            case '新しいゲーム':
                this.startNewGame();
                break;
            case '続きから':
                this.loadGame();
                break;
            case 'オプション':
                console.log('オプション（未実装）');
                break;
            case '終了':
                console.log('ゲーム終了');
                break;
        }
    }
    
    startNewGame() {
        console.log('新しいゲーム開始');
        
        // 新しいゲームデータを初期化
        const gameData = {
            player: {
                name: 'プレイヤー',
                level: 1,
                hp: 50,
                maxHp: 50,
                mp: 20,
                maxMp: 20,
                exp: 0,
                position: { x: 400, y: 300 }
            },
            world: {
                currentArea: 'overworld'
            },
            inventory: {
                items: [],
                money: 100
            },
            flags: {
                firstTime: true
            }
        };
        
        this.updateGameData(gameData);
        this.switchTo('worldmap');
    }
    
    loadGame() {
        const gameData = this.getGameData();
        
        if (gameData && gameData.player) {
            console.log('セーブデータ読み込み');
            this.switchTo('worldmap');
        } else {
            console.log('セーブデータなし');
        }
    }
    
    update(delta) {
        // 特に更新処理なし
    }
    
    handleInput(input) {
        if (!input) return;
        
        if (input['ArrowUp'] || input['KeyW']) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
            this.updateCursor();
        }
        
        if (input['ArrowDown'] || input['KeyS']) {
            this.selectedOption = Math.min(this.menuOptions.length - 1, this.selectedOption + 1);
            this.updateCursor();
        }
        
        if (input['Enter'] || input['Space']) {
            this.handleMenuSelection();
        }
    }
    
    destroy() {
        super.destroy();
        console.log('MenuScene破棄完了');
    }
}
