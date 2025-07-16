import * as PIXI from 'pixi.js';
import { SpellData } from '../data/SpellData.js';
import { gsap } from 'gsap';

export class ScrollDiscovery {
    constructor(sceneManager, playerInventory) {
        this.sceneManager = sceneManager;
        this.playerInventory = playerInventory;
        this.container = new PIXI.Container();
        this.isVisible = false;
    }

    init() {
        // 必要なら初期化処理をここに記述
    }

    // スクロール発見時の演出
    async discoverScroll(location) {
        const scrollLocationData = SpellData.SCROLL_LOCATIONS[location];
        if (!scrollLocationData) {
            console.error(`不明なスクロール場所: ${location}`);
            return;
        }

        // すでに習得済みかチェック
        if (this.playerInventory.learnedScrolls.has(location)) {
            this.showAlreadyLearnedMessage(scrollLocationData);
            return;
        }

        // 新しい魔法を習得
        const learnedSpells = this.playerInventory.learnSpellFromScroll(location);
        
        if (learnedSpells.length > 0) {
            await this.showScrollDiscoveryAnimation(scrollLocationData, learnedSpells);
        }
    }

    async showScrollDiscoveryAnimation(locationData, spells) {
        this.isVisible = true;
        this.createDiscoveryUI(locationData, spells);

        // フェードイン
        this.container.alpha = 0;
        await new Promise(resolve => {
            gsap.to(this.container, {
                alpha: 1,
                duration: 0.5,
                ease: "power2.out",
                onComplete: resolve
            });
        });

        // 自動的に閉じる（または手動で閉じるまで待機）
        await this.waitForInput();

        // フェードアウト
        await new Promise(resolve => {
            gsap.to(this.container, {
                alpha: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: resolve
            });
        });

        this.destroy();
    }

    createDiscoveryUI(locationData, spells) {
        // 背景オーバーレイ
        const overlay = new PIXI.Graphics();
        overlay.rect(0, 0, 800, 600);
        overlay.fill({ color: 0x000000, alpha: 0.8 });
        this.container.addChild(overlay);

        // メインパネル
        const panel = new PIXI.Graphics();
        panel.roundRect(100, 150, 600, 300, 20);
        panel.fill({ color: 0x2c1810, alpha: 0.95 });
        panel.stroke({ width: 4, color: 0xffd700 });
        this.container.addChild(panel);

        // 古代文字風の装飾
        this.addAncientDecorations(panel);

        // タイトル
        const titleText = new PIXI.Text('古代の魔法書を発見！', {
            fontFamily: 'Times New Roman',
            fontSize: 32,
            fill: 0xffd700,
            fontWeight: 'bold',
            align: 'center'
        });
        titleText.anchor.set(0.5);
        titleText.x = 400;
        titleText.y = 200;
        this.container.addChild(titleText);

        // 場所名
        const locationText = new PIXI.Text(locationData.name, {
            fontFamily: 'Times New Roman',
            fontSize: 20,
            fill: 0xcccccc,
            fontStyle: 'italic',
            align: 'center'
        });
        locationText.anchor.set(0.5);
        locationText.x = 400;
        locationText.y = 240;
        this.container.addChild(locationText);

        // 場所の説明
        const descText = new PIXI.Text(locationData.description, {
            fontFamily: 'Times New Roman',
            fontSize: 16,
            fill: 0xdddddd,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 500
        });
        descText.anchor.set(0.5);
        descText.x = 400;
        descText.y = 280;
        this.container.addChild(descText);

        // 習得した魔法のリスト
        let yOffset = 320;
        spells.forEach((spell, index) => {
            const spellText = new PIXI.Text(`✦ ${spell.name}`, {
                fontFamily: 'Times New Roman',
                fontSize: 20,
                fill: this.getSpellTypeColor(spell.type),
                fontWeight: 'bold',
                align: 'center'
            });
            spellText.anchor.set(0.5);
            spellText.x = 400;
            spellText.y = yOffset + (index * 30);
            this.container.addChild(spellText);

            // 魔法の説明
            const spellDesc = new PIXI.Text(spell.description, {
                fontFamily: 'Times New Roman',
                fontSize: 14,
                fill: 0xaaaaaa,
                align: 'center'
            });
            spellDesc.anchor.set(0.5);
            spellDesc.x = 400;
            spellDesc.y = yOffset + (index * 30) + 20;
            this.container.addChild(spellDesc);

            yOffset += 50;
        });

        // 操作説明
        const controlText = new PIXI.Text('Enterキーまたはスペースキーで閉じる', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x888888,
            align: 'center'
        });
        controlText.anchor.set(0.5);
        controlText.x = 400;
        controlText.y = 420;
        this.container.addChild(controlText);
    }

    addAncientDecorations(panel) {
        // 古代風の装飾を追加
        
        // 左上の角飾り
        const leftDecoration = new PIXI.Graphics();
        leftDecoration.stroke({ width: 3, color: 0xffd700 });
        leftDecoration.moveTo(120, 170);
        leftDecoration.lineTo(150, 170);
        leftDecoration.lineTo(150, 200);
        leftDecoration.moveTo(120, 200);
        leftDecoration.lineTo(150, 170);
        panel.addChild(leftDecoration);

        // 右上の角飾り
        const rightDecoration = new PIXI.Graphics();
        rightDecoration.stroke({ width: 3, color: 0xffd700 });
        rightDecoration.moveTo(680, 170);
        rightDecoration.lineTo(650, 170);
        rightDecoration.lineTo(650, 200);
        rightDecoration.moveTo(680, 200);
        rightDecoration.lineTo(650, 170);
        panel.addChild(rightDecoration);

        // 中央の魔法陣風装飾
        const magicCircle = new PIXI.Graphics();
        magicCircle.stroke({ width: 2, color: 0x8b7355, alpha: 0.7 });
        magicCircle.circle(400, 300, 80);
        magicCircle.circle(400, 300, 60);
        magicCircle.circle(400, 300, 40);
        
        // 星形の模様
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const x1 = 400 + Math.cos(angle) * 30;
            const y1 = 300 + Math.sin(angle) * 30;
            const x2 = 400 + Math.cos(angle) * 50;
            const y2 = 300 + Math.sin(angle) * 50;
            
            magicCircle.moveTo(x1, y1);
            magicCircle.lineTo(x2, y2);
        }
        
        panel.addChild(magicCircle);
    }

    showAlreadyLearnedMessage(locationData) {
        this.isVisible = true;
        
        // 簡単なメッセージパネル
        const overlay = new PIXI.Graphics();
        overlay.rect(0, 0, 800, 600);
        overlay.fill({ color: 0x000000, alpha: 0.6 });
        this.container.addChild(overlay);

        const panel = new PIXI.Graphics();
        panel.roundRect(200, 250, 400, 100, 10);
        panel.fill({ color: 0x333333, alpha: 0.9 });
        panel.stroke({ width: 2, color: 0x666666 });
        this.container.addChild(panel);

        const messageText = new PIXI.Text('この場所の魔法は既に習得済みです', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xffffff,
            align: 'center'
        });
        messageText.anchor.set(0.5);
        messageText.x = 400;
        messageText.y = 300;
        this.container.addChild(messageText);

        // 3秒後に自動で閉じる
        setTimeout(() => {
            this.destroy();
        }, 3000);
    }

    async waitForInput() {
        return new Promise(resolve => {
            const inputHandler = (event) => {
                if (event.code === 'Enter' || event.code === 'Space') {
                    document.removeEventListener('keydown', inputHandler);
                    resolve();
                }
            };
            
            document.addEventListener('keydown', inputHandler);
        });
    }

    getSpellTypeColor(type) {
        const colors = {
            'attack': 0xff6b6b,
            'healing': 0x51cf66,
            'buff': 0x339af0,
            'debuff': 0xffa94d,
            'special': 0xda77f2
        };
        return colors[type] || 0xffffff;
    }

    destroy() {
        this.isVisible = false;
        this.container.destroy();
    }

    // 特定の場所にスクロールが配置されているかチェック
    static hasScrollAtLocation(location) {
        return SpellData.SCROLL_LOCATIONS[location] !== undefined;
    }

    // すべてのスクロール場所を取得
    static getAllScrollLocations() {
        return Object.keys(SpellData.SCROLL_LOCATIONS);
    }

    // ランダムなスクロール場所を取得
    static getRandomScrollLocation() {
        const locations = this.getAllScrollLocations();
        return locations[Math.floor(Math.random() * locations.length)];
    }
}
