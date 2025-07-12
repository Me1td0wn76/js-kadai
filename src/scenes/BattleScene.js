import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { BaseScene } from './SceneManager.js';
import { PlayerIcon } from '../entities/PlayerIcon.js';
import { EnemyIcon } from '../entities/EnemyIcon.js';
import { ImageLoader } from '../assets/ImageLoader.js';
import { ItemData } from '../data/ItemData.js';
import { SpellData } from '../data/SpellData.js';
import { PlayerInventory } from '../data/PlayerInventory.js';
import { InventoryUI } from '../ui/InventoryUI.js';

export class BattleScene extends BaseScene {
    constructor(sceneManager, transitionData = {}) {
        super(sceneManager, transitionData);
        this.enemy = transitionData.enemy || { name: '未知の敵', level: 1 };
        this.enemyId = transitionData.enemyId || null; // 敵の固有ID
        this.battleBackground = transitionData.battleBackground || 'field';
        this.returnScene = transitionData.returnScene || 'worldmap';
        this.returnData = transitionData.returnData || {};
        
        this.playerSprite = null;
        this.enemySprite = null;
        this.uiContainer = null;
        this.messageBox = null;
        this.actionMenu = null;
        this.inventoryUI = null;
        
        this.battleState = 'start'; // start, playerTurn, enemyTurn, victory, defeat
        this.isAnimating = false;
        this.currentMessage = '';
        this.messageQueue = [];
        this.selectedAction = 0;
        this.actionMenuType = 'main'; // main, items, spells
        
        // 戦闘データ
        this.playerStats = null;
        this.enemyStats = null;
        this.imageLoader = null;
        this.playerInventory = null;
        
        // 戦闘結果
        this.battleResult = {
            enemyDefeated: false,
            playerEscaped: false,
            expGained: 0,
            levelUp: false
        };

        // アクションメニューの選択肢
        this.mainActions = ['攻撃', '魔法', 'アイテム', '逃走'];
        this.currentSpells = [];
        this.currentItems = [];
    }
    
    async init() {
        this.container = new PIXI.Container();
        
        // ImageLoaderを初期化
        this.imageLoader = new ImageLoader();
        await this.imageLoader.loadAllAssets();
        
        // 背景を作成
        this.createBackground();
        
        // キャラクタースプライトを作成
        this.createCharacterSprites();
        
        // UI要素を作成
        this.createBattleUI();
        
        // 戦闘データを初期化
        this.initializeBattleData();
        
        // 戦闘開始
        this.startBattle();
        
        console.log(`戦闘開始: vs ${this.enemy.name}`);
    }
    
    createBackground() {
        const background = new PIXI.Graphics();
        
        if (this.battleBackground === 'dungeon') {
            // ダンジョン背景（明るめに調整）
            background.rect(0, 0, 800, 600);
            background.fill(0x4a3628); // より明るい茶色
            
            // 石壁の模様（明るめ）
            background.rect(0, 0, 800, 100);
            background.fill(0x6d5442);
            
            background.rect(0, 500, 800, 100);
            background.fill(0x6d5442);
            
            // 石ブロック
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * 800;
                const y = 100 + Math.random() * 400;
                background.rect(x, y, 40, 20);
                background.fill(0x8b7355);
            }
            
            // 照明効果（中央からの光）
            const lightGradient = new PIXI.Graphics();
            const centerX = 400;
            const centerY = 300;
            const radius = 300;
            
            // 放射状グラデーション効果をシミュレート
            for (let r = radius; r > 0; r -= 10) {
                const alpha = (radius - r) / radius * 0.3;
                lightGradient.circle(centerX, centerY, r);
                lightGradient.fill({ color: 0xffeeaa, alpha: alpha });
            }
            
            this.container.addChild(lightGradient);
            
        } else {
            // フィールド背景
            background.rect(0, 0, 800, 600);
            background.fill(0x4a7c59);
            
            // 草の模様
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * 800;
                const y = 400 + Math.random() * 200;
                background.circle(x, y, 10 + Math.random() * 15);
                background.fill(0x2d5016);
            }
        }
        
        this.container.addChild(background);
        
        // 雲や装飾要素
        this.createBackgroundDetails();
    }
    
    createBackgroundDetails() {
        // 雲（フィールドのみ）
        if (this.battleBackground === 'field') {
            for (let i = 0; i < 3; i++) {
                const cloud = new PIXI.Graphics();
                cloud.ellipse(0, 0, 60, 30);
                cloud.fill({ color: 0xffffff, alpha: 0.7 });
                cloud.ellipse(30, 0, 40, 20);
                cloud.fill({ color: 0xffffff, alpha: 0.7 });
                cloud.ellipse(-30, 0, 40, 20);
                cloud.fill({ color: 0xffffff, alpha: 0.7 });
                
                cloud.x = 100 + i * 250;
                cloud.y = 80 + Math.random() * 40;
                
                this.container.addChild(cloud);
                
                // 雲の移動アニメーション
                gsap.to(cloud, {
                    x: cloud.x + 100,
                    duration: 10 + Math.random() * 5,
                    ease: "none",
                    repeat: -1,
                    yoyo: true
                });
            }
        }
    }
    
    createCharacterSprites() {
        // プレイヤースプライト（PlayerIconを使用）
        this.playerIcon = new PlayerIcon(this.imageLoader);
        this.playerSprite = this.playerIcon.createBattleSprite();
        this.playerSprite.x = 200;
        this.playerSprite.y = 400;
        this.container.addChild(this.playerSprite);
        
        // 敵スプライト（EnemyIconを使用）
        this.createEnemySprite();
        
        // キャラクターのアニメーション
        this.setupCharacterAnimations();
    }
    
    createEnemySprite() {
        // EnemyIconクラスを使用して敵の種類に応じたスプライトを作成
        const enemyType = this.enemy.enemyType || 'troll';
        this.enemyIcon = new EnemyIcon(this.imageLoader, enemyType);
        this.enemySprite = this.enemyIcon.createBattleSprite();
        this.enemySprite.x = 600;
        this.enemySprite.y = 350;
        this.container.addChild(this.enemySprite);
        
        console.log(`戦闘画面に敵 ${enemyType} を配置しました`);
    }
    
    setupCharacterAnimations() {
        // プレイヤーのアイドルアニメーション
        gsap.to(this.playerSprite, {
            y: this.playerSprite.y - 5,
            duration: 2,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1
        });
        
        // 敵のアニメーション
        if (this.enemy.name === 'スライム') {
            gsap.to(this.enemySprite.scale, {
                x: 1.1,
                y: 0.9,
                duration: 1.5,
                ease: "power2.inOut",
                yoyo: true,
                repeat: -1
            });
        } else {
            gsap.to(this.enemySprite, {
                rotation: 0.1,
                duration: 3,
                ease: "power2.inOut",
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    createBattleUI() {
        // メッセージボックス
        this.createMessageBox();
        
        // アクションメニュー
        this.createActionMenu();
        
        // ステータス表示
        this.createStatusDisplay();
    }
    
    createMessageBox() {
        const messageContainer = new PIXI.Container();
        
        // メッセージボックスの背景
        const messageBg = new PIXI.Graphics();
        messageBg.fill({ color: 0x000000, alpha: 0.8 });
        messageBg.roundRect(50, 450, 700, 120, 10);
        
        messageBg.stroke({ width: 3, color: 0xffffff, alpha: 1 });
        messageBg.roundRect(50, 450, 700, 120, 10);
        
        messageContainer.addChild(messageBg);
        
        // メッセージテキスト
        this.messageText = new PIXI.Text('', {
            fontFamily: 'Courier New',
            fontSize: 18,
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: 650
        });
        this.messageText.x = 70;
        this.messageText.y = 470;
        
        messageContainer.addChild(this.messageText);
        this.container.addChild(messageContainer);
        this.messageBox = messageContainer;
    }
    
    createActionMenu() {
        this.actionMenu = new PIXI.Container();
        
        // メインアクションメニューの背景
        this.createMenuBackground();
        
        // アクション選択肢のハイライト背景
        this.actionHighlights = [];
        this.actionTexts = [];
        
        this.updateActionMenu();
        
        this.actionMenu.visible = false;
        this.container.addChild(this.actionMenu);
    }

    createMenuBackground() {
        const menuBg = new PIXI.Graphics();
        menuBg.fill({ color: 0x000000, alpha: 0.9 });
        menuBg.roundRect(450, 300, 300, 200, 10);
        
        menuBg.stroke({ width: 2, color: 0xffffff, alpha: 1 });
        menuBg.roundRect(450, 300, 300, 200, 10);
        
        this.actionMenu.addChild(menuBg);
        
        // 選択カーソル（より目立つように）
        this.cursor = new PIXI.Graphics();
        this.cursor.fill(0xffff00);
        this.cursor.poly([0, 0, 20, 12, 0, 24]);
        this.cursor.x = 455;
        this.actionMenu.addChild(this.cursor);
    }

    updateActionMenu() {
        // 既存のアクション要素をクリア
        this.actionHighlights.forEach(highlight => highlight.destroy());
        this.actionTexts.forEach(text => text.destroy());
        this.actionHighlights = [];
        this.actionTexts = [];

        let actions = [];
        
        if (this.actionMenuType === 'main') {
            actions = this.mainActions;
        } else if (this.actionMenuType === 'spells') {
            const availableSpells = this.playerInventory.getSpellList();
            actions = availableSpells.map(spell => `${spell.name} (MP${spell.mpCost})`);
            actions.push('← 戻る');
        } else if (this.actionMenuType === 'items') {
            const availableItems = this.playerInventory.getItemList();
            actions = availableItems.map(item => `${item.name} x${item.quantity}`);
            actions.push('← 戻る');
        }

        actions.forEach((action, index) => {
            // 選択時のハイライト背景
            const highlight = new PIXI.Graphics();
            highlight.fill({ color: 0x4a90e2, alpha: 0.3 });
            highlight.roundRect(470, 325 + index * 35, 260, 30, 5);
            highlight.visible = false;
            this.actionMenu.addChild(highlight);
            this.actionHighlights.push(highlight);
            
            // アクションテキスト
            const text = new PIXI.Text(action, {
                fontFamily: 'Courier New',
                fontSize: 18,
                fill: 0xffffff
            });
            text.x = 480;
            text.y = 330 + index * 35;
            
            this.actionMenu.addChild(text);
            this.actionTexts.push(text);
        });

        // カーソル位置を更新
        this.updateCursor();
    }
    
    createStatusDisplay() {
        // プレイヤーステータス
        const playerStatus = new PIXI.Container();
        
        const playerBg = new PIXI.Graphics();
        playerBg.fill({ color: 0x000000, alpha: 0.7 });
        playerBg.roundRect(20, 20, 200, 100, 5);
        
        playerStatus.addChild(playerBg);
        
        this.playerStatusText = new PIXI.Text('', {
            fontFamily: 'Courier New',
            fontSize: 14,
            fill: 0xffffff
        });
        this.playerStatusText.x = 30;
        this.playerStatusText.y = 30;
        
        playerStatus.addChild(this.playerStatusText);
        this.container.addChild(playerStatus);
        
        // 敵ステータス
        const enemyStatus = new PIXI.Container();
        
        const enemyBg = new PIXI.Graphics();
        enemyBg.fill({ color: 0x000000, alpha: 0.7 });
        enemyBg.roundRect(580, 20, 200, 100, 5);
        
        enemyStatus.addChild(enemyBg);
        
        this.enemyStatusText = new PIXI.Text('', {
            fontFamily: 'Courier New',
            fontSize: 14,
            fill: 0xffffff
        });
        this.enemyStatusText.x = 590;
        this.enemyStatusText.y = 30;
        
        enemyStatus.addChild(this.enemyStatusText);
        this.container.addChild(enemyStatus);
    }
    
    initializeBattleData() {
        const gameData = this.getGameData();
        
        // プレイヤーの戦闘ステータス
        this.playerStats = {
            name: 'プレイヤー',
            level: gameData.player.level,
            hp: Math.max(0, gameData.player.hp),
            maxHp: gameData.player.maxHp,
            mp: Math.max(0, gameData.player.mp),
            maxMp: gameData.player.maxMp,
            attack: 10 + gameData.player.level * 3,
            defense: 5 + gameData.player.level * 2,
            magicAttack: 8 + gameData.player.level * 2,
            speed: 5 + gameData.player.level
        };
        
        // 敵の戦闘ステータス
        this.enemyStats = {
            name: this.enemy.name,
            level: this.enemy.level,
            hp: 30 + this.enemy.level * 15,
            maxHp: 30 + this.enemy.level * 15,
            attack: 8 + this.enemy.level * 2,
            defense: 3 + this.enemy.level * 1,
            magicAttack: 6 + this.enemy.level,
            speed: 4 + this.enemy.level,
            statusEffects: [],
            buffs: []
        };
        
        // プレイヤーのインベントリを初期化
        this.playerInventory = new PlayerInventory();
        
        // デバッグ用アイテムと魔法を追加
        this.playerInventory.addDebugItems();
        this.playerInventory.addDebugSpells();
        
        // レベルに応じた魔法を習得
        const newSpells = this.playerInventory.learnSpellsByLevel(this.playerStats.level);
        if (newSpells.length > 0) {
            console.log(`レベル${this.playerStats.level}で習得可能な魔法:`, newSpells.map(s => s.name));
        }
        
        // インベントリUIを作成
        this.inventoryUI = new InventoryUI(this.sceneManager, this.playerInventory);
        this.container.addChild(this.inventoryUI.container);
        
        this.updateStatusDisplay();
    }
    
    updateStatusDisplay() {
        this.playerStatusText.text = 
            `${this.playerStats.name} Lv.${this.playerStats.level}\n` +
            `HP: ${this.playerStats.hp}/${this.playerStats.maxHp}\n` +
            `MP: ${this.playerStats.mp}/${this.playerStats.maxMp}`;
        
        this.enemyStatusText.text = 
            `${this.enemyStats.name} Lv.${this.enemyStats.level}\n` +
            `HP: ${this.enemyStats.hp}/${this.enemyStats.maxHp}`;
    }
    
    startBattle() {
        this.queueMessage(`${this.enemyStats.name}が現れた！`);
        this.battleState = 'playerTurn';
        setTimeout(() => {
            this.showActionMenu();
        }, 2000);
    }
    
    queueMessage(message) {
        this.messageQueue.push(message);
        if (!this.isAnimating) {
            this.processMessageQueue();
        }
    }
    
    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        this.isAnimating = true;
        const message = this.messageQueue.shift();
        
        // タイプライター効果
        let index = 0;
        this.messageText.text = '';
        
        const typeWriter = () => {
            if (index < message.length) {
                this.messageText.text += message[index];
                index++;
                setTimeout(typeWriter, 50);
            } else {
                this.isAnimating = false;
                setTimeout(() => {
                    this.processMessageQueue();
                }, 1000);
            }
        };
        
        typeWriter();
    }

    addMessage(message) {
        this.messageQueue.push(message);
        if (!this.isAnimating) {
            this.processMessageQueue();
        }
    }

    // メッセージキューを処理
    processMessageQueue() {
        if (this.messageQueue.length > 0) {
            const nextMessage = this.messageQueue.shift();
            this.showMessage(nextMessage);
        }
    }

    // メッセージを表示（タイプライター効果付き）
    showMessage(message) {
        this.isAnimating = true;
        
        // タイプライター効果
        let index = 0;
        this.messageText.text = '';
        
        const typeWriter = () => {
            if (index < message.length) {
                this.messageText.text += message[index];
                index++;
                setTimeout(typeWriter, 50);
            } else {
                this.isAnimating = false;
                setTimeout(() => {
                    this.processMessageQueue();
                }, 1000);
            }
        };
        
        typeWriter();
    }
    
    showActionMenu() {
        this.actionMenu.visible = true;
        this.battleState = 'selectAction';
        this.selectedAction = 0;
        this.updateCursor();
        
        gsap.fromTo(this.actionMenu, 
            { alpha: 0, x: this.actionMenu.x + 50 },
            { alpha: 1, x: this.actionMenu.x, duration: 0.3, ease: "back.out(1.7)" }
        );
        
        // カーソルの点滅アニメーション
        this.cursorBlinkTween = gsap.to(this.cursor, {
            alpha: 0.3,
            duration: 0.8,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1
        });
    }
    
    hideActionMenu() {
        // カーソルアニメーションを停止
        if (this.cursorBlinkTween) {
            this.cursorBlinkTween.kill();
            this.cursor.alpha = 1; // アルファ値をリセット
        }
        
        gsap.to(this.actionMenu, {
            alpha: 0,
            duration: 0.2,
            onComplete: () => {
                this.actionMenu.visible = false;
            }
        });
    }
    
    updateCursor() {
        // カーソルの位置を更新
        this.cursor.y = 335 + this.selectedAction * 35;
        
        // 全てのハイライトを非表示にし、テキスト色を白に戻す
        this.actionHighlights.forEach((highlight, index) => {
            highlight.visible = false;
            this.actionTexts[index].style.fill = 0xffffff;
        });
        
        // 選択されたアクションのハイライトを表示し、テキスト色を変更
        if (this.actionHighlights[this.selectedAction]) {
            this.actionHighlights[this.selectedAction].visible = true;
            this.actionTexts[this.selectedAction].style.fill = 0xffff00; // 黄色
        }
        
        // カーソルのアニメーション
        gsap.fromTo(this.cursor.scale,
            { x: 1, y: 1 },
            { x: 1.3, y: 1.3, duration: 0.2, ease: "back.out(1.7)" }
        );
        
        // ハイライトのフェードインアニメーション
        if (this.actionHighlights[this.selectedAction]) {
            gsap.fromTo(this.actionHighlights[this.selectedAction],
                { alpha: 0 },
                { alpha: 0.5, duration: 0.3, ease: "power2.out" }
            );
        }
        
        // 選択音効果（将来的に音声ファイルを追加する場合のプレースホルダー）
        console.log(`選択: ${this.actionTexts[this.selectedAction].text}`);
    }
    
    handleAction(actionIndex) {
        // 選択確定時の視覚効果
        const selectedText = this.actionTexts[actionIndex];
        const selectedHighlight = this.actionHighlights[actionIndex];
        
        // 選択されたアクションをフラッシュ
        gsap.to(selectedText, {
            alpha: 0.3,
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            ease: "power2.inOut"
        });
        
        // ハイライトを明るくフラッシュ
        if (selectedHighlight) {
            gsap.to(selectedHighlight, {
                alpha: 1,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
        }
        
        // カーソルの確定アニメーション
        gsap.to(this.cursor, {
            scale: 1.5,
            duration: 0.2,
            ease: "back.out(1.7)",
            onComplete: () => {
                gsap.to(this.cursor, {
                    scale: 1,
                    duration: 0.1
                });
            }
        });
        
        // 少し遅れてアクションを実行（フィードバック効果を見せるため）
        setTimeout(() => {
            // 攻撃または逃走の場合のみメニューを隠す
            if (actionIndex === 0 || actionIndex === 3) { // 攻撃または逃走
                this.hideActionMenu();
            }
            
            switch (actionIndex) {
                case 0: // 攻撃
                    this.playerAttack();
                    break;
                case 1: // 魔法
                    this.showSpellMenu();
                    break;
                case 2: // アイテム
                    this.showItemMenu();
                    break;
                case 3: // 逃走
                    this.tryEscape();
                    break;
            }
        }, 150); // タイミングも短縮
    }
    
    showSpellMenu() {
        console.log('Showing spell menu');
        this.actionMenuType = 'spells';
        this.selectedAction = 0;
        
        // スペルリストを取得
        this.currentSpells = this.playerInventory.getSpellList();
        console.log('Available spells:', this.currentSpells);
        
        this.updateSpellMenu();
        
        // メニューが既に表示されている場合はアニメーションをスキップ
        if (!this.actionMenu.visible) {
            console.log('Menu not visible, showing with animation');
            this.actionMenu.visible = true;
            
            gsap.fromTo(this.actionMenu, 
                { alpha: 0, y: this.actionMenu.y + 50 },
                { alpha: 1, y: this.actionMenu.y, duration: 0.3, ease: "back.out(1.7)" }
            );
        } else {
            console.log('Menu already visible, updating content only');
            // 既に表示されている場合は内容だけ更新
            this.updateSpellMenu();
        }
    }
    
    updateSpellMenu() {
        // スペルリストを取得
        if (!this.currentSpells) {
            this.currentSpells = this.playerInventory.getSpellList();
        }
        
        console.log('Current spells in menu:', this.currentSpells);
        
        // スペルメニューの更新
        this.actionHighlights.forEach((highlight, index) => {
            highlight.visible = index === this.selectedAction;
        });
        
        // カーソルの位置を更新
        this.cursor.y = 335 + this.selectedAction * 35;
        
        // スペルのテキストを更新
        this.currentSpells.forEach((spell, index) => {
            console.log(`Spell ${index}:`, spell.name, 'MP Cost:', spell.mpCost);
            this.actionTexts[index].text = `${spell.name} (MP: ${spell.mpCost})`;
        });
        
        // 戻るオプションを追加
        if (this.currentSpells.length < this.actionTexts.length) {
            this.actionTexts[this.currentSpells.length].text = '戻る';
        }
        
        // 不足しているスペルのテキストをクリア
        for (let i = this.currentSpells.length + 1; i < this.actionTexts.length; i++) {
            this.actionTexts[i].text = '';
        }
        
        // アニメーション
        gsap.fromTo(this.cursor.scale,
            { x: 1, y: 1 },
            { x: 1.3, y: 1.3, duration: 0.2, ease: "back.out(1.7)" }
        );
    }
    
    showItemMenu() {
        this.actionMenuType = 'items';
        this.selectedAction = 0;
        
        // アイテムリストを取得
        this.currentItems = this.playerInventory.getItemList();
        
        this.updateItemMenu();
        
        // メニューが既に表示されている場合はアニメーションをスキップ
        if (!this.actionMenu.visible) {
            this.actionMenu.visible = true;
            
            gsap.fromTo(this.actionMenu, 
                { alpha: 0, y: this.actionMenu.y + 50 },
                { alpha: 1, y: this.actionMenu.y, duration: 0.3, ease: "back.out(1.7)" }
            );
        } else {
            // 既に表示されている場合は内容だけ更新
            this.updateItemMenu();
        }
    }
    
    updateItemMenu() {
        // アイテムリストを取得
        if (!this.currentItems) {
            this.currentItems = this.playerInventory.getItemList();
        }
        
        // アイテムメニューの更新
        this.actionHighlights.forEach((highlight, index) => {
            highlight.visible = index === this.selectedAction;
        });
        
        // カーソルの位置を更新
        this.cursor.y = 335 + this.selectedAction * 35;
        
        // アイテムのテキストを更新
        this.currentItems.forEach((item, index) => {
            this.actionTexts[index].text = `${item.name} x${item.quantity}`;
        });
        
        // 戻るオプションを追加
        if (this.currentItems.length < this.actionTexts.length) {
            this.actionTexts[this.currentItems.length].text = '戻る';
        }
        
        // 不足しているアイテムのテキストをクリア
        for (let i = this.currentItems.length + 1; i < this.actionTexts.length; i++) {
            this.actionTexts[i].text = '';
        }
        
        // アニメーション
        gsap.fromTo(this.cursor.scale,
            { x: 1, y: 1 },
            { x: 1.3, y: 1.3, duration: 0.2, ease: "back.out(1.7)" }
        );
    }
    
    playerAttack() {
        this.battleState = 'playerAttack';
        
        // プレイヤーの攻撃アニメーション
        gsap.to(this.playerSprite, {
            x: this.playerSprite.x + 100,
            duration: 0.3,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                this.calculateDamage(this.playerStats, this.enemyStats, 'attack');
            }
        });
    }
    
    playerMagic(spellIndex) {
        if (this.playerStats.mp < 5) {
            this.queueMessage('MPが足りない！');
            this.battleState = 'playerTurn';
            setTimeout(() => this.showActionMenu(), 1500);
            return;
        }
        
        this.battleState = 'playerMagic';
        this.playerStats.mp -= 5;
        
        const spell = this.currentSpells[spellIndex];
        
        // 魔法エフェクト
        this.createMagicEffect(spell);
        
        setTimeout(() => {
            this.calculateDamage(this.playerStats, this.enemyStats, 'magic');
        }, 1000);
    }
    
    createMagicEffect(spell) {
        for (let i = 0; i < 10; i++) {
            const star = new PIXI.Graphics();
            star.fill(0xffff00);
            star.poly([0, -10, 3, -3, 10, 0, 3, 3, 0, 10, -3, 3, -10, 0, -3, -3]);
            
            star.x = this.enemySprite.x + (Math.random() - 0.5) * 100;
            star.y = this.enemySprite.y + (Math.random() - 0.5) * 100;
            
            this.container.addChild(star);
            
            gsap.to(star, {
                alpha: 0,
                scale: 0,
                duration: 1,
                ease: "power2.out",
                onComplete: () => {
                    this.container.removeChild(star);
                }
            });
        }
    }
    
    useItem(itemIndex) {
        const item = this.currentItems[itemIndex];
        
        if (item.type === 'heal') {
            this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + item.value);
            this.queueMessage(`${item.name}を使った！\nHPが${item.value}回復した。`);
        } else if (item.type === 'mp') {
            this.playerStats.mp = Math.min(this.playerStats.maxMp, this.playerStats.mp + item.value);
            this.queueMessage(`${item.name}を使った！\nMPが${item.value}回復した。`);
        }
        
        // アイテム使用後の処理
        this.playerInventory.useItem(item.name);
        this.currentItems = this.playerInventory.getItems();
        
        this.updateStatusDisplay();
        
        setTimeout(() => {
            this.battleState = 'enemyTurn';
            this.enemyTurn();
        }, 1500);
    }
    
    tryEscape() {
        const escapeChance = 0.5 + (this.playerStats.level - this.enemyStats.level) * 0.1;
        
        if (Math.random() < escapeChance) {
            this.queueMessage('うまく逃げ切った！');
            
            // 逃走結果を記録（敵は残る）
            this.battleResult = {
                victory: false,
                escaped: true,
                enemyId: this.enemyId
            };
            
            setTimeout(() => {
                this.endBattle('escape');
            }, 2000);
        } else {
            this.queueMessage('逃げられなかった！');
            setTimeout(() => {
                this.enemyTurn();
            }, 2000);
        }
    }
    
    calculateDamage(attacker, defender, type) {
        let baseDamage = attacker.attack;
        
        if (type === 'magic') {
            baseDamage = Math.floor(baseDamage * 1.5);
        }
        
        const damage = Math.max(1, baseDamage - defender.defense + Math.floor(Math.random() * 5));
        defender.hp = Math.max(0, defender.hp - damage);
        
        // ダメージエフェクト
        this.showDamageEffect(defender === this.enemyStats ? this.enemySprite : this.playerSprite, damage);
        
        const attackerName = attacker === this.playerStats ? 'プレイヤー' : attacker.name;
        const defenderName = defender === this.playerStats ? 'プレイヤー' : defender.name;
        
        this.queueMessage(`${attackerName}の攻撃！\n${defenderName}に${damage}のダメージ！`);
        
        this.updateStatusDisplay();
        
        setTimeout(() => {
            if (defender.hp <= 0) {
                if (defender === this.enemyStats) {
                    this.victory();
                } else {
                    this.defeat();
                }
            } else {
                if (attacker === this.playerStats) {
                    this.enemyTurn();
                } else {
                    this.battleState = 'playerTurn';
                    this.showActionMenu();
                }
            }
        }, 2000);
    }
    
    showDamageEffect(target, damage) {
        // ダメージ数値を表示
        const damageText = new PIXI.Text(damage.toString(), {
            fontFamily: 'Arial',
            fontSize: 36,
            fill: 0xff0000,
            fontWeight: 'bold'
        });
        
        damageText.x = target.x;
        damageText.y = target.y - 50;
        damageText.anchor.set(0.5);
        
        this.container.addChild(damageText);
        
        gsap.fromTo(damageText, 
            { y: target.y - 50, alpha: 1 },
            { 
                y: target.y - 100, 
                alpha: 0, 
                duration: 1.5,
                ease: "power2.out",
                onComplete: () => {
                    this.container.removeChild(damageText);
                }
            }
        );
        
        // 被弾エフェクト
        gsap.to(target, {
            tint: 0xff0000,
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                target.tint = 0xffffff;
            }
        });
    }
    
    enemyTurn() {
        this.battleState = 'enemyTurn';
        
        setTimeout(() => {
            // 敵の攻撃アニメーション
            gsap.to(this.enemySprite, {
                x: this.enemySprite.x - 100,
                duration: 0.3,
                ease: "power2.out",
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    this.calculateDamage(this.enemyStats, this.playerStats, 'attack');
                }
            });
        }, 1000);
    }
    
    victory() {
        this.battleState = 'victory';
        
        // 敵の撃破エフェクト
        gsap.to(this.enemySprite, {
            alpha: 0,
            scale: 0,
            rotation: Math.PI,
            duration: 1,
            ease: "power2.in"
        });
        
        const exp = 10 + this.enemyStats.level * 5;
        this.queueMessage(`${this.enemyStats.name}を倒した！\n${exp}の経験値を獲得！`);
        
        // 経験値とレベルアップ処理
        const gameData = this.getGameData();
        gameData.player.exp = (gameData.player.exp || 0) + exp;
        
        let leveledUp = false;
        if (gameData.player.exp >= gameData.player.level * 100) {
            gameData.player.level++;
            gameData.player.maxHp += 10;
            gameData.player.maxMp += 5;
            gameData.player.hp = gameData.player.maxHp; // レベルアップで全回復
            gameData.player.mp = gameData.player.maxMp;
            gameData.player.exp = 0;
            leveledUp = true;
            
            this.queueMessage(`レベルアップ！レベル${gameData.player.level}になった！`);
        }
        
        this.updateGameData(gameData);
        
        // 戦闘結果を記録（敵の除去のため）
        this.battleResult = {
            victory: true,
            enemyId: this.enemyId,
            experienceGained: exp,
            leveledUp: leveledUp
        };
        
        setTimeout(() => {
            this.endBattle('victory');
        }, 4000);
    }
    
    defeat() {
        this.battleState = 'defeat';
        
        // プレイヤーの撃破エフェクト
        gsap.to(this.playerSprite, {
            alpha: 0.5,
            rotation: Math.PI / 2,
            duration: 1,
            ease: "power2.in"
        });
        
        this.queueMessage('プレイヤーは倒れた...');
        
        setTimeout(() => {
            this.endBattle('defeat');
        }, 3000);
    }
    
    endBattle(result) {
        if (result === 'defeat') {
            // ゲームオーバー処理（HPを1にして街に戻すなど）
            const gameData = this.getGameData();
            gameData.player.hp = 1;
            this.updateGameData(gameData);
            
            this.switchTo('worldmap');
        } else {
            // 戦闘結果をダンジョンシーンに渡して元のシーンに戻る
            this.switchTo(this.returnScene, this.battleResult || this.returnData);
        }
    }
    
    update(delta) {
        // 戦闘中は特に更新処理なし
    }
    
    handleInput(input) {
        console.log('BattleScene handleInput called', { 
            battleState: this.battleState, 
            isAnimating: this.isAnimating,
            input: input
        });
        
        // インベントリUIが表示されている場合は、そちらに処理を委譲
        if (this.inventoryUI && this.inventoryUI.isVisible) {
            return this.inventoryUI.handleInput(input);
        }

        if (this.battleState === 'selectAction' && !this.isAnimating) {
            this.handleMenuInput(input);
        }
    }

    handleMenuInput(input) {
        console.log('handleMenuInput called', { selectedAction: this.selectedAction, input: input });
        
        const maxActions = this.getMaxActionIndex();

        if (input['ArrowUp'] || input['KeyW']) {
            console.log('Up pressed');
            this.selectedAction = Math.max(0, this.selectedAction - 1);
            this.updateCursor();
        }

        if (input['ArrowDown'] || input['KeyS']) {
            console.log('Down pressed');
            this.selectedAction = Math.min(maxActions - 1, this.selectedAction + 1);
            this.updateCursor();
        }

        if (input['Enter'] || input['Space']) {
            console.log('Enter/Space pressed, executing action:', this.selectedAction);
            this.executeSelectedAction();
        }

        if (input['Escape']) {
            console.log('Escape pressed');
            this.handleEscapeAction();
        }
    }

    getMaxActionIndex() {
        if (this.actionMenuType === 'main') {
            return this.mainActions.length;
        } else if (this.actionMenuType === 'spells') {
            return this.playerInventory.getSpellList().length + 1; // +1 for back option
        } else if (this.actionMenuType === 'items') {
            return this.playerInventory.getItemList().length + 1; // +1 for back option
        }
        return 0;
    }

    executeSelectedAction() {
        if (this.actionMenuType === 'main') {
            this.handleAction(this.selectedAction);
        } else if (this.actionMenuType === 'spells') {
            this.handleSpellAction(this.selectedAction);
        } else if (this.actionMenuType === 'items') {
            this.handleItemAction(this.selectedAction);
        }
    }

    handleMainAction(actionIndex) {
        this.handleAction(actionIndex);
    }

    handleSpellAction(actionIndex) {
        const spells = this.playerInventory.getSpellList();
        
        if (actionIndex === spells.length) {
            // 戻るオプション
            this.switchToMainMenu();
            return;
        }

        if (actionIndex < spells.length) {
            const spell = spells[actionIndex];
            this.castSpell(spell);
        }
    }

    handleItemAction(actionIndex) {
        const items = this.playerInventory.getItemList();
        
        if (actionIndex === items.length) {
            // 戻るオプション
            this.switchToMainMenu();
            return;
        }

        if (actionIndex < items.length) {
            const item = items[actionIndex];
            this.useItem(item);
        }
    }

    handleEscapeAction() {
        if (this.actionMenuType === 'main') {
            // メインメニューでエスケープは何もしない、または逃走
            return;
        } else {
            // サブメニューからメインメニューに戻る
            this.switchToMainMenu();
        }
    }

    switchToSpellMenu() {
        this.actionMenuType = 'spells';
        this.selectedAction = 0;
        this.updateActionMenu();
        this.showActionMenu();
    }

    switchToItemMenu() {
        this.actionMenuType = 'items';
        this.selectedAction = 0;
        this.updateActionMenu();
        this.showActionMenu();
    }

    switchToMainMenu() {
        this.actionMenuType = 'main';
        this.selectedAction = 0;
        this.updateActionMenu();
        this.updateCursor();
    }

    // 魔法を使用
    castSpell(spell) {
        if (!SpellData.canCastSpell(spell, this.playerStats)) {
            this.addMessage(`MPが足りません！（必要MP: ${spell.mpCost}）`);
            this.switchToMainMenu();
            return;
        }

        SpellData.consumeMana(spell, this.playerStats);
        const result = SpellData.calculateSpellEffect(spell, this.playerStats, this.enemyStats);

        this.addMessage(`${this.playerStats.name}は${spell.name}を唱えた！`);
        
        if (result.damage) {
            this.enemyStats.hp = Math.max(0, this.enemyStats.hp - result.damage);
        }

        if (result.healing) {
            this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + result.healing);
        }

        if (result.effect) {
            this.applyBuffOrDebuff(result.effect, result.duration, spell.target);
        }

        if (result.escape) {
            this.battleResult.playerEscaped = true;
            this.endBattle();
            return;
        }

        // SpellDataからのメッセージのみを使用（重複を避ける）
        result.messages.forEach(msg => this.addMessage(msg));
        
        this.updateStatusDisplay();
        this.hideActionMenu();
        
        // 敵のHPが0以下になったかチェック
        if (this.enemyStats.hp <= 0) {
            this.victory();
        } else {
            this.nextTurn();
        }
    }

    // アイテムを使用
    useItem(item) {
        if (!this.playerInventory.hasItem(item.id)) {
            this.addMessage(`${item.name}を持っていません！`);
            this.switchToMainMenu();
            return;
        }

        this.playerInventory.useItem(item.id, 1);

        if (item.type === 'attack') {
            const result = ItemData.calculateDamageItemEffect(item, this.playerStats, this.enemyStats);
            this.enemyStats.hp = Math.max(0, this.enemyStats.hp - result.damage);
            result.messages.forEach(msg => this.addMessage(msg));
        } else {
            const results = ItemData.applyItemEffect(item, this.playerStats);
            results.forEach(msg => this.addMessage(msg));
        }

        this.updateStatusDisplay();
        this.hideActionMenu();
        
        // 敵のHPが0以下になったかチェック
        if (this.enemyStats.hp <= 0) {
            this.victory();
        } else {
            this.nextTurn();
        }
    }

    applyBuffOrDebuff(effects, duration, target) {
        const targetStats = target === 'enemy' ? this.enemyStats : this.playerStats;
        
        if (!targetStats.buffs) targetStats.buffs = [];
        
        targetStats.buffs.push({
            effects: effects,
            duration: duration
        });
    }
    
    switchToMainMenu() {
        this.actionMenuType = 'main';
        this.selectedAction = 0;
        this.updateMainMenu();
        
        // メインメニューの表示
        this.actionMenu.visible = true;
        
        gsap.fromTo(this.actionMenu, 
            { alpha: 0, y: this.actionMenu.y + 50 },
            { alpha: 1, y: this.actionMenu.y, duration: 0.3, ease: "back.out(1.7)" }
        );
    }

    updateMainMenu() {
        // メインメニューの更新
        this.actionHighlights.forEach((highlight, index) => {
            highlight.visible = index === this.selectedAction;
        });
        
        // カーソルの位置を更新
        this.cursor.y = 335 + this.selectedAction * 35;
        
        // メインメニューのテキストを設定
        const mainActions = ['攻撃', '魔法', 'アイテム', '逃走'];
        mainActions.forEach((action, index) => {
            if (this.actionTexts[index]) {
                this.actionTexts[index].text = action;
            }
        });
        
        // 不要なテキストをクリア
        for (let i = mainActions.length; i < this.actionTexts.length; i++) {
            if (this.actionTexts[i]) {
                this.actionTexts[i].text = '';
            }
        }
        
        // アニメーション
        gsap.fromTo(this.cursor.scale,
            { x: 1, y: 1 },
            { x: 1.3, y: 1.3, duration: 0.2, ease: "back.out(1.7)" }
        );
    }
    
    destroy() {
        super.destroy();
        console.log('戦闘シーンが終了しました');
    }

    nextTurn() {
        // ターンを敵に移す
        this.battleState = 'enemyTurn';
        setTimeout(() => {
            this.enemyTurn();
        }, 1000);
    }
}
