import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { BaseScene } from './SceneManager.js';
import { PlayerIcon } from '../entities/PlayerIcon.js';
import { EnemyIcon } from '../entities/EnemyIcon.js';
import { ImageLoader } from '../assets/ImageLoader.js';

export class BattleScene extends BaseScene {
    constructor(sceneManager, transitionData = {}) {
        super(sceneManager, transitionData);
        this.enemy = transitionData.enemy || { name: '未知の敵', level: 1 };
        this.battleBackground = transitionData.battleBackground || 'field';
        this.returnScene = transitionData.returnScene || 'worldmap';
        this.returnData = transitionData.returnData || {};
        
        this.playerSprite = null;
        this.enemySprite = null;
        this.uiContainer = null;
        this.messageBox = null;
        this.actionMenu = null;
        
        this.battleState = 'start'; // start, playerTurn, enemyTurn, victory, defeat
        this.isAnimating = false;
        this.currentMessage = '';
        this.messageQueue = [];
        this.selectedAction = 0;
        
        // 戦闘データ
        this.playerStats = null;
        this.enemyStats = null;
        this.imageLoader = null;
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
        // 新しいEnemyIconクラスを使用して敵を作成
        this.enemyIcon = new EnemyIcon(this.imageLoader, 'trool');
        this.enemySprite = this.enemyIcon.createBattleSprite();
        this.enemySprite.x = 600;
        this.enemySprite.y = 350;
        this.container.addChild(this.enemySprite);
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
        
        const actions = ['攻撃', '魔法', 'アイテム', '逃げる'];
        const menuBg = new PIXI.Graphics();
        menuBg.fill({ color: 0x000000, alpha: 0.9 });
        menuBg.roundRect(450, 300, 300, 200, 10);
        
        menuBg.stroke({ width: 2, color: 0xffffff, alpha: 1 });
        menuBg.roundRect(450, 300, 300, 200, 10);
        
        this.actionMenu.addChild(menuBg);
        
        this.actionTexts = [];
        actions.forEach((action, index) => {
            const text = new PIXI.Text(action, {
                fontFamily: 'Courier New',
                fontSize: 20,
                fill: 0xffffff
            });
            text.x = 480;
            text.y = 330 + index * 35;
            
            this.actionMenu.addChild(text);
            this.actionTexts.push(text);
        });
        
        // 選択カーソル
        this.cursor = new PIXI.Graphics();
        this.cursor.fill(0xffff00);
        this.cursor.poly([0, 0, 15, 10, 0, 20]);
        this.cursor.x = 460;
        this.updateCursor();
        
        this.actionMenu.addChild(this.cursor);
        this.actionMenu.visible = false;
        this.container.addChild(this.actionMenu);
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
            hp: gameData.player.hp,
            maxHp: gameData.player.maxHp,
            mp: gameData.player.mp,
            maxMp: gameData.player.maxMp,
            attack: 10 + gameData.player.level * 3,
            defense: 5 + gameData.player.level * 2
        };
        
        // 敵の戦闘ステータス
        this.enemyStats = {
            name: this.enemy.name,
            level: this.enemy.level,
            hp: 30 + this.enemy.level * 15,
            maxHp: 30 + this.enemy.level * 15,
            attack: 8 + this.enemy.level * 2,
            defense: 3 + this.enemy.level * 1
        };
        
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
                }, 500);
            }
        };
        
        typeWriter();
    }
    
    showActionMenu() {
        this.actionMenu.visible = true;
        this.battleState = 'selectAction';
        
        gsap.fromTo(this.actionMenu, 
            { alpha: 0, x: this.actionMenu.x + 50 },
            { alpha: 1, x: this.actionMenu.x, duration: 0.3, ease: "back.out(1.7)" }
        );
    }
    
    hideActionMenu() {
        gsap.to(this.actionMenu, {
            alpha: 0,
            duration: 0.2,
            onComplete: () => {
                this.actionMenu.visible = false;
            }
        });
    }
    
    updateCursor() {
        this.cursor.y = 335 + this.selectedAction * 35;
        
        gsap.fromTo(this.cursor.scale,
            { x: 1, y: 1 },
            { x: 1.2, y: 1.2, duration: 0.2, ease: "back.out(1.7)" }
        );
    }
    
    handleAction(actionIndex) {
        this.hideActionMenu();
        
        switch (actionIndex) {
            case 0: // 攻撃
                this.playerAttack();
                break;
            case 1: // 魔法
                this.playerMagic();
                break;
            case 2: // アイテム
                this.useItem();
                break;
            case 3: // 逃げる
                this.tryEscape();
                break;
        }
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
    
    playerMagic() {
        if (this.playerStats.mp < 5) {
            this.queueMessage('MPが足りない！');
            this.battleState = 'playerTurn';
            setTimeout(() => this.showActionMenu(), 1500);
            return;
        }
        
        this.battleState = 'playerMagic';
        this.playerStats.mp -= 5;
        
        // 魔法エフェクト
        this.createMagicEffect();
        
        setTimeout(() => {
            this.calculateDamage(this.playerStats, this.enemyStats, 'magic');
        }, 1000);
    }
    
    createMagicEffect() {
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
    
    useItem() {
        this.queueMessage('使えるアイテムがない！');
        this.battleState = 'playerTurn';
        setTimeout(() => this.showActionMenu(), 1500);
    }
    
    tryEscape() {
        const escapeChance = 0.5 + (this.playerStats.level - this.enemyStats.level) * 0.1;
        
        if (Math.random() < escapeChance) {
            this.queueMessage('うまく逃げ切った！');
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
        gameData.player.exp += exp;
        
        if (gameData.player.exp >= gameData.player.level * 100) {
            gameData.player.level++;
            gameData.player.maxHp += 10;
            gameData.player.maxMp += 5;
            gameData.player.hp = gameData.player.maxHp; // レベルアップで全回復
            gameData.player.mp = gameData.player.maxMp;
            gameData.player.exp = 0;
            
            this.queueMessage(`レベルアップ！レベル${gameData.player.level}になった！`);
        }
        
        this.updateGameData(gameData);
        
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
            // 元のシーンに戻る
            this.switchTo(this.returnScene, this.returnData);
        }
    }
    
    update(delta) {
        // 戦闘中は特に更新処理なし
    }
    
    handleInput(input) {
        this.keys = input;
        
        if (this.battleState === 'selectAction' && !this.isAnimating) {
            if (input['ArrowUp'] || input['KeyW']) {
                this.selectedAction = Math.max(0, this.selectedAction - 1);
                this.updateCursor();
            }
            if (input['ArrowDown'] || input['KeyS']) {
                this.selectedAction = Math.min(3, this.selectedAction + 1);
                this.updateCursor();
            }
            if (input['Enter'] || input['Space']) {
                this.handleAction(this.selectedAction);
            }
        }
    }
    
    destroy() {
        super.destroy();
        console.log('戦闘シーンが終了しました');
    }
}
