import * as PIXI from 'pixi.js';
import { ItemData } from '../data/ItemData.js';
import { SpellData } from '../data/SpellData.js';

export class InventoryUI {
    constructor(sceneManager, playerInventory) {
        this.sceneManager = sceneManager;
        this.inventory = playerInventory;
        this.container = new PIXI.Container();
        this.isVisible = false;
        this.selectedTab = 'items'; // 'items' or 'spells'
        this.selectedIndex = 0;
        this.itemsPerPage = 8;
        this.currentPage = 0;
        
        this.createUI();
    }

    createUI() {
        // 背景パネル
        this.background = new PIXI.Graphics();
        this.background.rect(50, 50, 700, 500);
        this.background.fill({ color: 0x000000, alpha: 0.9 });
        this.background.stroke({ width: 3, color: 0xffffff });
        this.container.addChild(this.background);

        // タイトル
        this.titleText = new PIXI.Text('インベントリ', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xffffff,
            align: 'center'
        });
        this.titleText.anchor.set(0.5, 0);
        this.titleText.x = 400;
        this.titleText.y = 70;
        this.container.addChild(this.titleText);

        // タブボタン
        this.createTabButtons();

        // コンテンツエリア
        this.contentContainer = new PIXI.Container();
        this.contentContainer.x = 70;
        this.contentContainer.y = 150;
        this.container.addChild(this.contentContainer);

        // ページネーション
        this.createPagination();

        // 詳細表示エリア
        this.createDetailArea();

        // 操作説明
        this.createControlsInfo();

        this.container.visible = false;
    }

    createTabButtons() {
        const tabY = 110;
        const tabWidth = 120;
        const tabHeight = 30;

        // アイテムタブ
        this.itemsTab = new PIXI.Graphics();
        this.itemsTab.rect(150, tabY, tabWidth, tabHeight);
        this.itemsTab.fill(0x333333);
        this.itemsTab.stroke({ width: 2, color: 0xffffff });
        this.container.addChild(this.itemsTab);

        this.itemsTabText = new PIXI.Text('アイテム', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'center'
        });
        this.itemsTabText.anchor.set(0.5);
        this.itemsTabText.x = 210;
        this.itemsTabText.y = tabY + 15;
        this.container.addChild(this.itemsTabText);

        // 魔法タブ
        this.spellsTab = new PIXI.Graphics();
        this.spellsTab.rect(280, tabY, tabWidth, tabHeight);
        this.spellsTab.fill(0x333333);
        this.spellsTab.stroke({ width: 2, color: 0xffffff });
        this.container.addChild(this.spellsTab);

        this.spellsTabText = new PIXI.Text('魔法', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'center'
        });
        this.spellsTabText.anchor.set(0.5);
        this.spellsTabText.x = 340;
        this.spellsTabText.y = tabY + 15;
        this.container.addChild(this.spellsTabText);

        this.updateTabColors();
    }

    createPagination() {
        this.pageText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xcccccc,
            align: 'center'
        });
        this.pageText.anchor.set(0.5);
        this.pageText.x = 400;
        this.pageText.y = 520;
        this.container.addChild(this.pageText);
    }

    createDetailArea() {
        // 右側の詳細表示エリア
        this.detailBackground = new PIXI.Graphics();
        this.detailBackground.rect(450, 150, 280, 300);
        this.detailBackground.fill({ color: 0x111111, alpha: 0.8 });
        this.detailBackground.stroke({ width: 2, color: 0x666666 });
        this.container.addChild(this.detailBackground);

        this.detailContainer = new PIXI.Container();
        this.detailContainer.x = 460;
        this.detailContainer.y = 160;
        this.container.addChild(this.detailContainer);
    }

    createControlsInfo() {
        const controls = [
            '矢印キー: 選択移動',
            'Tab: タブ切り替え',
            'Enter: 使用',
            'Escape: 閉じる'
        ];

        let y = 470;
        for (const control of controls) {
            const text = new PIXI.Text(control, {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xcccccc
            });
            text.x = 70;
            text.y = y;
            this.container.addChild(text);
            y += 15;
        }
    }

    show() {
        this.isVisible = true;
        this.container.visible = true;
        this.updateContent();
    }

    hide() {
        this.isVisible = false;
        this.container.visible = false;
    }

    switchTab(tab) {
        this.selectedTab = tab;
        this.selectedIndex = 0;
        this.currentPage = 0;
        this.updateTabColors();
        this.updateContent();
    }

    updateTabColors() {
        // タブの色を更新
        this.itemsTab.clear();
        this.itemsTab.rect(150, 110, 120, 30);
        this.itemsTab.fill(this.selectedTab === 'items' ? 0x4a90e2 : 0x333333);
        this.itemsTab.stroke({ width: 2, color: 0xffffff });

        this.spellsTab.clear();
        this.spellsTab.rect(280, 110, 120, 30);
        this.spellsTab.fill(this.selectedTab === 'spells' ? 0x4a90e2 : 0x333333);
        this.spellsTab.stroke({ width: 2, color: 0xffffff });
    }

    updateContent() {
        // 既存のコンテンツをクリア
        this.contentContainer.removeChildren();
        this.detailContainer.removeChildren();

        if (this.selectedTab === 'items') {
            this.updateItemsList();
        } else {
            this.updateSpellsList();
        }

        this.updatePagination();
        this.updateDetail();
    }

    updateItemsList() {
        const items = this.inventory.getItemList();
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, items.length);

        for (let i = startIndex; i < endIndex; i++) {
            const item = items[i];
            const listIndex = i - startIndex;
            const isSelected = i === this.selectedIndex;

            this.createItemEntry(item, listIndex, isSelected);
        }
    }

    updateSpellsList() {
        const spells = this.inventory.getSpellList();
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, spells.length);

        for (let i = startIndex; i < endIndex; i++) {
            const spell = spells[i];
            const listIndex = i - startIndex;
            const isSelected = i === this.selectedIndex;

            this.createSpellEntry(spell, listIndex, isSelected);
        }
    }

    createItemEntry(item, index, isSelected) {
        const y = index * 35;
        const width = 350;
        const height = 30;

        // 選択背景
        if (isSelected) {
            const selectionBg = new PIXI.Graphics();
            selectionBg.rect(0, y, width, height);
            selectionBg.fill({ color: 0x4a90e2, alpha: 0.5 });
            this.contentContainer.addChild(selectionBg);
        }

        // アイテム名
        const nameText = new PIXI.Text(item.name, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: ItemData.getRarityColor(item.rarity)
        });
        nameText.x = 10;
        nameText.y = y + 5;
        this.contentContainer.addChild(nameText);

        // 所持数
        const quantityText = new PIXI.Text(`x${item.quantity}`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xcccccc
        });
        quantityText.x = width - 50;
        quantityText.y = y + 8;
        this.contentContainer.addChild(quantityText);
    }

    createSpellEntry(spell, index, isSelected) {
        const y = index * 35;
        const width = 350;
        const height = 30;

        // 選択背景
        if (isSelected) {
            const selectionBg = new PIXI.Graphics();
            selectionBg.rect(0, y, width, height);
            selectionBg.fill({ color: 0x4a90e2, alpha: 0.5 });
            this.contentContainer.addChild(selectionBg);
        }

        // 魔法名
        const nameText = new PIXI.Text(spell.name, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: this.getSpellTypeColor(spell.type)
        });
        nameText.x = 10;
        nameText.y = y + 5;
        this.contentContainer.addChild(nameText);

        // MP消費
        const mpText = new PIXI.Text(`MP${spell.mpCost}`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x00ccff
        });
        mpText.x = width - 60;
        mpText.y = y + 8;
        this.contentContainer.addChild(mpText);
    }

    updateDetail() {
        const items = this.selectedTab === 'items' ? this.inventory.getItemList() : this.inventory.getSpellList();
        
        if (items.length === 0 || this.selectedIndex >= items.length) {
            return;
        }

        const selectedItem = items[this.selectedIndex];

        if (this.selectedTab === 'items') {
            this.showItemDetail(selectedItem);
        } else {
            this.showSpellDetail(selectedItem);
        }
    }

    showItemDetail(item) {
        // アイテム名
        const nameText = new PIXI.Text(item.name, {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: ItemData.getRarityColor(item.rarity),
            fontWeight: 'bold'
        });
        nameText.x = 10;
        nameText.y = 10;
        this.detailContainer.addChild(nameText);

        // タイプとレアリティ
        const typeText = new PIXI.Text(`${item.type} - ${item.rarity}`, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xcccccc
        });
        typeText.x = 10;
        typeText.y = 35;
        this.detailContainer.addChild(typeText);

        // 説明
        const descText = new PIXI.Text(item.description, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: 250
        });
        descText.x = 10;
        descText.y = 60;
        this.detailContainer.addChild(descText);

        // 所持数
        const quantityText = new PIXI.Text(`所持数: ${item.quantity}`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffff00
        });
        quantityText.x = 10;
        quantityText.y = 120;
        this.detailContainer.addChild(quantityText);
    }

    showSpellDetail(spell) {
        // 魔法名
        const nameText = new PIXI.Text(spell.name, {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: this.getSpellTypeColor(spell.type),
            fontWeight: 'bold'
        });
        nameText.x = 10;
        nameText.y = 10;
        this.detailContainer.addChild(nameText);

        // タイプと属性
        const typeText = new PIXI.Text(`${spell.type}${spell.element ? ` (${spell.element})` : ''}`, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xcccccc
        });
        typeText.x = 10;
        typeText.y = 35;
        this.detailContainer.addChild(typeText);

        // MP消費
        const mpText = new PIXI.Text(`MP消費: ${spell.mpCost}`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x00ccff
        });
        mpText.x = 10;
        mpText.y = 55;
        this.detailContainer.addChild(mpText);

        // 説明
        const descText = new PIXI.Text(spell.description, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: 250
        });
        descText.x = 10;
        descText.y = 80;
        this.detailContainer.addChild(descText);

        // 習得方法
        const learnText = new PIXI.Text(
            spell.learnType === 'level' 
                ? `レベル${spell.levelRequired}で習得` 
                : `スクロール習得: ${spell.scrollLocation}`,
            {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xffff00
            }
        );
        learnText.x = 10;
        learnText.y = 140;
        this.detailContainer.addChild(learnText);
    }

    updatePagination() {
        const items = this.selectedTab === 'items' ? this.inventory.getItemList() : this.inventory.getSpellList();
        const totalPages = Math.ceil(items.length / this.itemsPerPage);
        
        if (totalPages > 1) {
            this.pageText.text = `${this.currentPage + 1} / ${totalPages}`;
        } else {
            this.pageText.text = '';
        }
    }

    getSpellTypeColor(type) {
        const colors = {
            'attack': 0xff4444,
            'healing': 0x44ff44,
            'buff': 0x4444ff,
            'debuff': 0xffaa44,
            'special': 0xff44ff
        };
        return colors[type] || 0xffffff;
    }

    handleInput(input) {
        if (!this.isVisible) return false;

        const items = this.selectedTab === 'items' ? this.inventory.getItemList() : this.inventory.getSpellList();
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (input['ArrowUp'] || input['KeyW']) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.adjustPage();
            this.updateContent();
            return true;
        }

        if (input['ArrowDown'] || input['KeyS']) {
            this.selectedIndex = Math.min(totalItems - 1, this.selectedIndex + 1);
            this.adjustPage();
            this.updateContent();
            return true;
        }

        if (input['Tab']) {
            this.switchTab(this.selectedTab === 'items' ? 'spells' : 'items');
            return true;
        }

        if (input['Enter'] || input['Space']) {
            this.useSelectedItem();
            return true;
        }

        if (input['Escape']) {
            this.hide();
            return true;
        }

        return false;
    }

    adjustPage() {
        const itemsOnCurrentPage = this.selectedIndex >= this.currentPage * this.itemsPerPage && 
                                   this.selectedIndex < (this.currentPage + 1) * this.itemsPerPage;
        
        if (!itemsOnCurrentPage) {
            this.currentPage = Math.floor(this.selectedIndex / this.itemsPerPage);
        }
    }

    useSelectedItem() {
        if (this.selectedTab === 'items') {
            const items = this.inventory.getItemList();
            if (items.length > 0 && this.selectedIndex < items.length) {
                const item = items[this.selectedIndex];
                // アイテム使用処理（バトルシーンから呼び出す）
                console.log(`${item.name}を使用しようとしています`);
            }
        } else {
            const spells = this.inventory.getSpellList();
            if (spells.length > 0 && this.selectedIndex < spells.length) {
                const spell = spells[this.selectedIndex];
                // 魔法使用処理（バトルシーンから呼び出す）
                console.log(`${spell.name}を使用しようとしています`);
            }
        }
    }

    destroy() {
        this.container.destroy();
    }
}
