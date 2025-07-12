import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { BaseScene } from './SceneManager.js';

export class MenuScene extends BaseScene {
    constructor(sceneManager, transitionData = {}) {
        super(sceneManager, transitionData);
        this.selectedOption = 0;
        this.menuOptions = ['ストーリー開始', '続きから', 'オプション', '終了'];
        this.menuTexts = [];
        this.titleText = null;
        this.subtitleText = null;
        this.cursor = null;
        this.isShowingStory = false;
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
        background.rect(0, 0, 800, 600);
        background.fill(0x000033);
        this.container.addChild(background);
        
        console.log('背景作成完了');
    }
    
    createTitle() {
        // メインタイトル
        this.titleText = new PIXI.Text('境界都市トウキョウ', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            fill: 0xff6b35,
            stroke: {
                color: 0x000000,
                width: 2
            },
            align: 'center'
        });
        
        this.titleText.anchor.set(0.5);
        this.titleText.x = 400;
        this.titleText.y = 120;
        
        this.container.addChild(this.titleText);
        
        // サブタイトル
        this.subtitleText = new PIXI.Text('～分岐の刻～', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xcccccc,
            fontStyle: 'italic',
            align: 'center'
        });
        
        this.subtitleText.anchor.set(0.5);
        this.subtitleText.x = 400;
        this.subtitleText.y = 160;
        
        this.container.addChild(this.subtitleText);
        
        console.log('タイトル作成完了');
    }
    
    createSimpleMenu() {
        // メニュー背景
        const menuBg = new PIXI.Graphics();
        menuBg.rect(300, 250, 200, 200);
        menuBg.fill({ color: 0x000000, alpha: 0.7 });
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
        this.cursor.poly([0, 0, 15, 8, 0, 16]);
        this.cursor.fill(0xffff00);
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
            case 'ストーリー開始':
                this.showStoryIntro();
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
    
    showStoryIntro() {
        this.isShowingStory = true;
        
        // 既存のメニューを隠す
        this.container.children.forEach(child => {
            if (child !== this.container.children[0]) { // 背景以外を隠す
                child.visible = false;
            }
        });
        
        // ストーリーコンテナを作成
        this.storyContainer = new PIXI.Container();
        this.container.addChild(this.storyContainer);
        
        // ストーリーテキストを作成
        this.createStoryText();
    }
    
    createStoryText() {
        const storyTexts = [
            {
                title: "プロローグ",
                content: "東京が崩壊したのは、ある『選択』がなされた日だった。\n人間は神を拒み、悪魔は人間を模倣し、世界は『中立』を失った。\n\nユウマは瓦礫の中で目覚める。記憶はない。\nだが、彼の手には『COMP（悪魔召喚端末）』が握られていた。"
            },
            {
                title: "第一章：境界都市",
                content: "ユウマは廃墟と化した渋谷を彷徨う。\n人間は地下に逃げ、地上は悪魔の領域となっていた。\n\nある日、ユウマはカグヤと出会う。彼女は言う。\n\n『あなたは分岐者。この世界を秩序か混沌かに導く者。』"
            }
        ];
        
        this.currentStoryIndex = 0;
        this.showStoryPage(storyTexts[this.currentStoryIndex]);
        this.storyTexts = storyTexts;
    }
    
    showStoryPage(storyData) {
        // 既存のストーリーテキストをクリア
        this.storyContainer.removeChildren();
        
        // タイトル
        const titleText = new PIXI.Text(storyData.title, {
            fontFamily: 'Arial Bold',
            fontSize: 28,
            fill: 0xff6b35,
            align: 'center'
        });
        titleText.anchor.set(0.5, 0);
        titleText.x = 400;
        titleText.y = 80;
        this.storyContainer.addChild(titleText);
        
        // コンテンツ
        const contentText = new PIXI.Text(storyData.content, {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xffffff,
            align: 'left',
            wordWrap: true,
            wordWrapWidth: 700,
            lineHeight: 24
        });
        contentText.anchor.set(0.5, 0);
        contentText.x = 400;
        contentText.y = 140;
        this.storyContainer.addChild(contentText);
        
        // 進行指示
        const nextText = new PIXI.Text(
            this.currentStoryIndex < this.storyTexts.length - 1 
                ? "Enterで次へ..." 
                : "Enterでゲーム開始！", 
            {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xffff00,
                align: 'center'
            }
        );
        nextText.anchor.set(0.5, 1);
        nextText.x = 400;
        nextText.y = 550;
        this.storyContainer.addChild(nextText);
        
        // 点滅エフェクト
        gsap.to(nextText, {
            alpha: 0.3,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut"
        });
    }
    
    nextStoryPage() {
        if (this.currentStoryIndex < this.storyTexts.length - 1) {
            this.currentStoryIndex++;
            this.showStoryPage(this.storyTexts[this.currentStoryIndex]);
        } else {
            // ストーリー終了、ゲーム開始
            this.startNewGame();
        }
    }
    
    backToMenu() {
        this.isShowingStory = false;
        
        // ストーリーコンテナを削除
        if (this.storyContainer) {
            this.container.removeChild(this.storyContainer);
            this.storyContainer = null;
        }
        
        // メニューを再表示
        this.container.children.forEach(child => {
            child.visible = true;
        });
    }
    
    startNewGame() {
        console.log('新しいゲーム開始');
        
        // 新しいゲームデータを初期化
        const gameData = {
            player: {
                name: 'ユウマ',
                level: 1,
                hp: 50,
                maxHp: 50,
                mp: 20,
                maxMp: 20,
                exp: 0,
                position: { x: 400, y: 300 }
            },
            world: {
                currentArea: 'boundary_city',
                visitedAreas: ['boundary_city'],
                chapter: 1
            },
            story: {
                currentChapter: 1,
                completedEvents: [],
                alignment: 'neutral', // law, chaos, neutral
                choiceHistory: []
            },
            demons: {
                summoned: [],
                negotiated: []
            },
            inventory: {
                items: ['COMP'],
                money: 0
            },
            flags: {
                firstTime: true,
                storyIntroSeen: true,
                kaguyaMet: false
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
        
        // ストーリー表示中の処理
        if (this.isShowingStory) {
            if (input['Enter'] || input['Space']) {
                this.nextStoryPage();
            }
            if (input['Escape']) {
                this.backToMenu();
            }
            return;
        }
        
        // メニュー選択の処理
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
